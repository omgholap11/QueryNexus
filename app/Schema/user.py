from pydantic import BaseModel , Field ,EmailStr
from typing import Annotated


class UserSchema(BaseModel):
    name : Annotated[str , Field(title="Name of the User")] 
    email : Annotated[EmailStr , Field(title="Provide the email of the user: ")]
    password : Annotated[str , Field(title="Password of the user: ")]
    

class UserSignInSchema(BaseModel): 
    email : Annotated[EmailStr , Field(title="Provide the email of the user: ")]
    password : Annotated[str , Field(title="Password of the user: ")]
    