import json
import logging
import re

logger = logging.getLogger(__name__)


def parse_llm_json(content: str, context: str = "") -> list | dict | None:
    content = content.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        result = json.loads(content)
        return result
    except json.JSONDecodeError as e:
        logger.warning(f"{context} initial parse failed: {e}")

    repaired = _repair_json(content)
    if repaired is not None:
        try:
            result = json.loads(repaired)
            logger.info(f"{context} parsed successfully after repair")
            return result
        except json.JSONDecodeError:
            pass

    logger.error(f"{context} failed to parse JSON even after repair")
    return None


def _repair_json(content: str) -> str | None:
    # Strategy 1: remove trailing commas (most common LLM JSON error)
    try:
        fixed = re.sub(r',\s*([}\]])', r'\1', content)
        json.loads(fixed)
        return fixed
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategy 2: handle unterminated strings
    try:
        result = _fix_unterminated_string(content)
        if result:
            json.loads(result)
            return result
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategy 3: find last complete value, truncate there, close brackets
    try:
        result = _truncate_to_last_complete(content)
        if result:
            json.loads(result)
            return result
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategy 4: no closing brackets at all — strip trailing comma, close everything
    try:
        result = _close_from_scratch(content)
        if result:
            json.loads(result)
            return result
    except (json.JSONDecodeError, ValueError):
        pass

    return None


def _fix_unterminated_string(content: str) -> str | None:
    """Handle case where the output is cut off mid-string or mid-value."""
    # Walk to find if we're inside a string at the end
    in_string = False
    escape = False
    last_quote = -1
    depth = 0

    for i, ch in enumerate(content):
        if escape:
            escape = False
            continue
        if ch == '\\' and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            if not in_string:
                last_quote = i
            continue
        if in_string:
            continue
        if ch in ('{', '['):
            depth += 1
        elif ch in ('}', ']'):
            depth = max(0, depth - 1)

    if not in_string:
        return None  # Not cut off mid-string

    # We're inside an unterminated string. Find last complete key-value pair.
    # Walk again more carefully to find last complete structural point.
    result = _close_from_inside_string(content)
    return result


def _close_from_inside_string(content: str) -> str | None:
    """Given content that ends mid-string, close the string and any open brackets."""
    # First, close the unterminated string
    content_fixed = content + '"'

    # Now count open brackets
    in_string = False
    escape = False
    open_brackets = []

    for ch in content_fixed:
        if escape:
            escape = False
            continue
        if ch == '\\' and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            open_brackets.append('}')
        elif ch == '[':
            open_brackets.append(']')
        elif ch == '}' and open_brackets and open_brackets[-1] == '}':
            open_brackets.pop()
        elif ch == ']' and open_brackets and open_brackets[-1] == ']':
            open_brackets.pop()

    # Remove trailing comma from the string value we just closed
    # e.g. '"hello",' -> '"hello"'
    content_fixed = re.sub(r'"\s*,\s*([}\]])', r'"\1', content_fixed)

    # Close open brackets
    for closer in reversed(open_brackets):
        content_fixed += closer

    return content_fixed


def _truncate_to_last_complete(content: str) -> str | None:
    """Find the last complete JSON value and close any open brackets."""
    # Remove trailing commas first
    cleaned = re.sub(r',\s*([}\]])', r'\1', content)

    # Find last } or ]
    last_obj = cleaned.rfind('}')
    last_arr = cleaned.rfind(']')
    last_brace = max(last_obj, last_arr)

    if last_brace < 0:
        return None

    truncated = cleaned[:last_brace + 1]

    # Count open brackets in the truncated part
    in_string = False
    escape = False
    open_brackets = []
    for ch in truncated:
        if escape:
            escape = False
            continue
        if ch == '\\' and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            open_brackets.append('}')
        elif ch == '[':
            open_brackets.append(']')
        elif ch == '}' and open_brackets and open_brackets[-1] == '}':
            open_brackets.pop()
        elif ch == ']' and open_brackets and open_brackets[-1] == ']':
            open_brackets.pop()

    for closer in reversed(open_brackets):
        truncated = truncated.rstrip()
        if truncated.endswith(','):
            truncated = truncated[:-1]
        truncated += closer

    return truncated


def _close_from_scratch(content: str) -> str | None:
    """When there are no closing brackets at all, close everything from the end."""
    # Track bracket depth by walking forward
    in_string = False
    escape = False
    open_brackets = []

    for ch in content:
        if escape:
            escape = False
            continue
        if ch == '\\' and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            open_brackets.append('}')
        elif ch == '[':
            open_brackets.append(']')
        elif ch == '}' and open_brackets and open_brackets[-1] == '}':
            open_brackets.pop()
        elif ch == ']' and open_brackets and open_brackets[-1] == ']':
            open_brackets.pop()

    if not open_brackets:
        return None

    result = content.rstrip()
    # Remove trailing comma
    if result.endswith(','):
        result = result[:-1]

    # Close open brackets (innermost first)
    for closer in reversed(open_brackets):
        result += closer

    return result
