from fastapi import APIRouter  , Depends ,BackgroundTasks , Path , Query , Request
from app.Schema.response import User_Chat_Payload , ChatSessionsSchemaForClient , CompleteChatResponseForClient
from app.Controllers.chat import get_response_from_model , handle_get_all_sessions , handle_get_sessions_messages , handle_delete_chat
from sqlalchemy.orm import Session
from app.Config.Database.database import get_db
from typing import Optional , List
from app.Dependencies.authentication import get_optimal_user_from_cookie
from app.Utils.rate_limiter import limiter
chat_router = APIRouter()


@chat_router.post("/get-response")
@limiter.limit("20/minute")
def get_response(
    request : Request,
    question : User_Chat_Payload,
    background_tasks : BackgroundTasks,
    current_user : Optional[dict] = Depends(get_optimal_user_from_cookie),     ## current user basically have the user id right 
    db : Session = Depends(get_db)
):
    data = question.payload
    print("Current User Token: ",current_user)    ## this is actually the dictionry with thw user details like id , name and email ...........   can always access this further
    # return get_response_from_model(data , current_user , db , background_tasks)
    return {"answer" : "As of Sunday, January 18, 2026, the stock markets have shown the following recent activity:\n\n*   **US Market:** Stocks finished last week slightly lower, influenced by political headlines and policy news. Key factors included Federal Reserve Chairman Jerome Powell being under criminal investigation by the Trump administration, global and geopolitical tensions rising from President Trump's threat of additional 25% tariffs on countries doing business with Iran, and weaker bank stocks due to concerns about a proposed cap on credit card interest rates, despite solid earnings reports. A favorable inflation report was noted mid-week (Week in review: Stocks battled a flood of news, and we booked some profits. (CNBC)).\n*   **Indian Market:** Markets largely consolidated during the past week, ending almost unchanged. The Nifty settled at 25,694.35 and the Sensex at 83,570.35. Broader indices saw modest gains. Indian markets are heading into the new week with a cautious, stock-specific tone (q3 results gold silver rates to india us trade deal top five triggers that may dictate indian stock market this week (Livemint))." ,
    "source" : ['https://www.cnbc.com/2026/01/17/week-in-review-stocks-battled-a-flood-of-news-and-we-booked-some-profits.html', 'https://www.livemint.com/market/stock-market-news/q3-results-gold-silver-rates-to-india-us-trade-deal-top-five-triggers-that-may-dictate-indian-stock-market-this-week-11768641823168.html']}


#  Implementing with the paginations 
# url structure >>  /get-all-sessions?offset=20&limit=20
@chat_router.get("/get-all-sessions" , response_model = List[ChatSessionsSchemaForClient])
@limiter.exempt
def get_all_sessions(
    request : Request,
    db : Session = Depends(get_db),
    current_user : dict = Depends(get_optimal_user_from_cookie),
    offset : str = Query(... , description="Offset of the starting session.."),
    limit : str = Query(description="Maximum number of the chats sessions.. " , default=20)  ## make this field as the optional and make the default value as the 20
):
    return handle_get_all_sessions(current_user=current_user , db=db , offset=offset , limit = limit)


@chat_router.get("/get-session-messages/{session_id}" , response_model= CompleteChatResponseForClient)
@limiter.exempt
def get_messages(
    request : Request,
    session_id : str = Path(...,description="Session Id of the chat to retrive the messages.."), 
    current_user: dict = Depends(get_optimal_user_from_cookie),
    db : Session = Depends(get_db),
    offset : str = Query(... , description="Index of the first starting chat...."),
    limit : str = Query(description="Maximum number of the chats required.." , default = 20)
):
    return handle_get_sessions_messages(session_id=session_id, offset=offset , current_user = current_user, db = db , limit=limit)

@chat_router.delete("/delete-session/{session_id}")
@limiter.limit("30/minute")
def delete_chats(
    request : Request,
    session_id : str = Path(... , description="Session id of the chat session to delete..."),
    db : Session = Depends(get_db)
):
    return handle_delete_chat(session_id=session_id , db=db)
    