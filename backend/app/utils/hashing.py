import bcrypt

class Hash:
    @staticmethod
    async def bcrypt(password: str) -> str:
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        return hashed_password.decode('utf-8')
                                    
    @staticmethod
    def verify(hashed_password: str, password: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
