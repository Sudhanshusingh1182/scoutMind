from sqlalchemy.orm import Session

from app.models.user import User, AuthProvider


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, user_id: int) -> User | None:
        return self.session.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.session.query(User).filter(User.email == email).first()

    def create(self, name: str, email: str, password_hash: str | None = None,
               auth_provider: AuthProvider = AuthProvider.EMAIL, avatar_url: str | None = None) -> User:
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            auth_provider=auth_provider,
            avatar_url=avatar_url,
            email_verified=(auth_provider == AuthProvider.GOOGLE),
        )
        self.session.add(user)
        self.session.flush()
        return user
