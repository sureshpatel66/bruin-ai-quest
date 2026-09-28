import os
os.environ['BRUIN_BACKEND']='rules'
from bruin_ai_quest.sim import BruinQuest

def test_registry_loads():
    game=BruinQuest()
    assert len(game.resources) >= 8
    assert all(r.get('official_url') for r in game.resources)

def test_gpu_routes_to_compute_resource():
    game=BruinQuest()
    result=game.route('I need GPU compute for a large biomedical dataset')
    selected=result['state']['selected']
    assert selected['zone'] == 'compute'
    assert selected['id'] == 'bruincloud'

def test_literature_routes_to_notebook():
    game=BruinQuest()
    result=game.route('I want help reading and synthesizing research papers')
    assert result['state']['selected']['id'] == 'gemini_notebook'


def test_single_cell_routes_to_qcbio():
    game=BruinQuest()
    result=game.route('I want help learning single-cell RNA-seq analysis')
    assert result['state']['selected']['id'] == 'qcbio_scrna'

def test_bio_ai_agents_routes_to_qcbio():
    game=BruinQuest()
    result=game.route('I want to learn AI agents for bioinformatics research')
    assert result['state']['selected']['id'] == 'qcbio_ai_agents'


def test_google_learning_credits_route_to_online_world():
    game=BruinQuest()
    result=game.route('I need Google Cloud learning credits as a student')
    selected=result['state']['selected']
    assert selected['id'] == 'online_google_cloud_skills'
    assert selected['world'] == 'online'


def test_model_gateway_routes_to_online_world():
    game=BruinQuest()
    result=game.route('I want to compare models through an independent LLM gateway')
    assert result['state']['selected']['id'] == 'online_openrouter'


def test_colab_routes_to_notebook_shop():
    game=BruinQuest()
    result=game.route('I need a Google Colab GPU notebook for a class exercise')
    assert result['state']['selected']['id'] == 'online_google_colab'

def test_online_catalog_expanded_and_source_linked():
    game=BruinQuest()
    assert len(game.online_resources) == 18
    expected={'online_kaggle_notebooks','online_lightning_ai','online_jetbrains_student','online_github_codespaces','online_openai_api','online_anthropic_api'}
    assert expected.issubset({r['id'] for r in game.online_resources})

def test_online_specific_rule_routes():
    game=BruinQuest()
    assert game.route('I want Kaggle notebooks with a free GPU')['state']['selected']['id'] == 'online_kaggle_notebooks'
    assert game.route('I need the OpenAI API for an agent prototype')['state']['selected']['id'] == 'online_openai_api'
    assert game.route('I want a free JetBrains student IDE for academic research')['state']['selected']['id'] == 'online_jetbrains_student'
