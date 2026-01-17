from pydantic import BaseModel , Field
from typing import Annotated , List

class LLM_Response(BaseModel):

    answer : Annotated[str , Field(title="The direct answer to the user's question. Use Markdown bolding for prices/metrics. Do NOT include a 'Sources' section here.")]

    source : Annotated[List[str] , Field(title="A list of unique source URLs used to generate the answer.")]