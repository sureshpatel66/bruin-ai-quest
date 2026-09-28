from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .sim import BruinQuest

app=FastAPI(title='Bruin AI Quest')
game=BruinQuest()
WEB=Path(__file__).resolve().parents[2]/'web'
app.mount('/static',StaticFiles(directory=WEB),name='static')

class JourneyRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    goal: str = Field(min_length=1, max_length=2000)

@app.get('/')
def index(): return FileResponse(WEB/'index.html')

@app.get('/api/resources')
def resources():
    state = game.snapshot()
    return {'resources':game.resources, 'ucla_resources':game.ucla_resources,
            'online_resources':game.online_resources, 'last_verified':state['last_verified'],
            'disclaimer':state['disclaimer']}

@app.post('/api/journey')
def journey(req:JourneyRequest): return BruinQuest().plan_journey(req.goal,None)
