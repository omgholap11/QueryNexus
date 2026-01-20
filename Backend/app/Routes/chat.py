from fastapi import APIRouter  , Depends ,BackgroundTasks
from app.Schema.response import User_Chat_Payload
from app.Controllers.chat import get_response_from_model
from sqlalchemy.orm import Session
from app.Config.Database.database import get_db
from typing import Optional
from app.Dependencies.authentication import get_optimal_user_from_cookie

chat_router = APIRouter()


@chat_router.post("/getresponse")
def get_response(
    request : User_Chat_Payload,
    background_tasks : BackgroundTasks,
    current_user : Optional[dict] = Depends(get_optimal_user_from_cookie),     ## current user basically have the user id right 
    db : Session = Depends(get_db)
):
    data = request.payload
    print("Current User Token: ",current_user)    ## this is actually the dictionry with thw user details like id , name and email ...........   can always access this further
    return get_response_from_model(data , current_user , db , background_tasks)
    return {"answer" : "As of Sunday, January 18, 2026, the stock markets have shown the following recent activity:\n\n*   **US Market:** Stocks finished last week slightly lower, influenced by political headlines and policy news. Key factors included Federal Reserve Chairman Jerome Powell being under criminal investigation by the Trump administration, global and geopolitical tensions rising from President Trump's threat of additional 25% tariffs on countries doing business with Iran, and weaker bank stocks due to concerns about a proposed cap on credit card interest rates, despite solid earnings reports. A favorable inflation report was noted mid-week (Week in review: Stocks battled a flood of news, and we booked some profits. (CNBC)).\n*   **Indian Market:** Markets largely consolidated during the past week, ending almost unchanged. The Nifty settled at 25,694.35 and the Sensex at 83,570.35. Broader indices saw modest gains. Indian markets are heading into the new week with a cautious, stock-specific tone (q3 results gold silver rates to india us trade deal top five triggers that may dictate indian stock market this week (Livemint))." ,
    "source" : ['https://www.cnbc.com/2026/01/17/week-in-review-stocks-battled-a-flood-of-news-and-we-booked-some-profits.html', 'https://www.livemint.com/market/stock-market-news/q3-results-gold-silver-rates-to-india-us-trade-deal-top-five-triggers-that-may-dictate-indian-stock-market-this-week-11768641823168.html']}