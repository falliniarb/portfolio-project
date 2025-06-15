
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/data")
def get_portfolio_data():
    """
    This function opens and reads the portfolio_data.json file,
    then sends all of its content as the response.
    """
    with open("portfolio_data.json", "r") as f:
        data = json.load(f)
    return data

@app.get("/")
def read_root():
    return {"Status": "Your portfolio backend is running!"}