from __future__ import annotations
import os
from typing import Any
import httpx


def _normalize(vals: dict[str,float]) -> dict[str,float]:
    vals={k:max(0.0001,float(v)) for k,v in vals.items()}
    total=sum(vals.values())
    return {k:v/total for k,v in vals.items()}


def _rule_journey_type(goal: str) -> str:
    g=goal.lower()
    if any(x in g for x in ['single cell','single-cell','scrna','rna-seq','rnaseq']) and any(x in g for x in ['learn','analy','research','workflow','dataset']): return 'single_cell_research'
    if any(x in g for x in ['agent','rag','tool use','automation']) and any(x in g for x in ['build','learn','research','gpu','model']): return 'ai_agent_builder'
    if any(x in g for x in ['literature','paper','pdf','review','synthesize','systematic review']): return 'literature_review'
    if any(x in g for x in ['openrouter','groq','openai api','claude api','anthropic api','gemini api','model api','compare models','llm api','api benchmark']): return 'model_api_exploration'
    if any(x in g for x in ['gpu','compute','tpu','accelerator','large dataset','scale compute']) and not any(x in g for x in ['credits','learn cloud']): return 'gpu_compute'
    if any(x in g for x in ['cloud skills','cloud credits','aws educate','azure student','learn cloud','student cloud']): return 'cloud_learning'
    if any(x in g for x in ['github','repo','repository','code','coding','python','software','publish']): return 'coding_project'
    return 'general_ai'


def rule_route(goal: str, resources: list[dict]) -> dict[str,Any]:
    g=goal.lower()
    weights={r['id']:0.05 for r in resources}
    def bump(ids, amount):
        for rid in ids:
            if rid in weights: weights[rid]+=amount
    if any(x in g for x in ['paper','literature','pdf','review','read','synthesize']): bump(['gemini_notebook'],3.0)
    if any(x in g for x in ['single cell','single-cell','scrna']): bump(['qcbio_scrna'],3.4)
    if any(x in g for x in ['ai agent','agents']) and any(x in g for x in ['bio','genom','research']): bump(['qcbio_ai_agents'],3.4)
    if any(x in g for x in ['bioinformatics','omics','rna-seq','rnaseq','genomics']): bump(['qcbio_ai_agents','qcbio_scrna','qcbio_llm'],2.2)
    if any(x in g for x in ['gpu','compute','cloud','tpu','large dataset']): bump(['bruincloud'],3.5)
    if any(x in g for x in ['modal','serverless gpu','cloud gpu','fine-tun','fine tun']): bump(['online_modal_cloud'],4.0)
    if any(x in g for x in ['google cloud skills','google skills','skill badge','gcp credits','google credits','cloud learning credit','cloud learning credits']): bump(['online_google_cloud_skills','online_google_cloud_education'],4.0)
    if any(x in g for x in ['google cloud course','course credit','instructor credit','gcp course']): bump(['online_google_cloud_education'],4.5)
    if any(x in g for x in ['aws educate','aws lab','aws learning']): bump(['online_aws_educate'],4.0)
    if any(x in g for x in ['azure student','azure credits','microsoft azure']): bump(['online_azure_for_students'],4.5)
    if any(x in g for x in ['google colab','colab notebook','colab gpu','colab tpu']): bump(['online_google_colab'],4.5)
    if any(x in g for x in ['gemini api','google ai studio','gemini developer']): bump(['online_gemini_api'],4.5)
    if any(x in g for x in ['cloudflare workers ai','workers ai','edge inference']): bump(['online_cloudflare_workers_ai'],4.5)
    if any(x in g for x in ['jetbrains','pycharm','intellij','dataspell','student ide']): bump(['online_jetbrains_student'],4.5)
    if any(x in g for x in ['codespaces','cloud dev','dev container','browser vscode']): bump(['online_github_codespaces'],4.5)
    if any(x in g for x in ['kaggle','kaggle notebook','free gpu notebook','free tpu notebook']): bump(['online_kaggle_notebooks'],4.5)
    if any(x in g for x in ['lightning ai','lightning studio','academic gpu','persistent gpu studio']): bump(['online_lightning_ai'],4.5)
    if any(x in g for x in ['openai api','gpt api','responses api']): bump(['online_openai_api'],4.7)
    if any(x in g for x in ['anthropic api','claude api','claude developer']): bump(['online_anthropic_api'],4.7)
    if any(x in g for x in ['student pack','github student','github education']): bump(['online_github_student_pack'],4.5)
    if any(x in g for x in ['openrouter','multi provider','model routing','llm gateway']): bump(['online_openrouter'],4.5)
    if any(x in g for x in ['groq','fast inference','low latency inference']): bump(['online_groq'],4.5)
    if any(x in g for x in ['hugging face','huggingface','model card','open weights','open model','dataset hub']): bump(['online_hugging_face'],4.5)
    if any(x in g for x in ['code','coding','python','github','debug','repository','repo']): bump(['github_copilot','aws_kiro','google_gemini','online_github_student_pack'],1.9)
    if any(x in g for x in ['compare models','one api','single endpoint','model gateway']): bump(['bruin_ai_gateway','online_openrouter'],3.2)
    elif any(x in g for x in ['model','compare','api','endpoint']): bump(['bruin_ai_gateway','google_gemini','online_openrouter','online_groq'],1.8)
    if any(x in g for x in ['workshop','learn','training','event']): bump(['ucla_ai_exchange','qcbio_ai_agents','github_copilot_101_event','aws_kiro_event'],1.8)
    if any(x in g for x in ['general','chat','write','reason']): bump(['google_gemini','microsoft_copilot'],1.5)
    p=_normalize(weights); rid=max(p,key=p.get)
    return {'resource_id':rid,'journey_type':_rule_journey_type(goal),'probabilities':p,'confidence':p[rid],'fit_score':0.78,'needs_human_help':0.18,'backend':'rules','model':'keyword-router'}


def classifier_route(goal: str, profile: dict, resources: list[dict]) -> dict[str,Any]:
    criteria={r['id']: f"{r['name']}: {r['best_for']} Status={r['status']}. Eligibility={r['eligibility']}" for r in resources}
    state={'student_goal':goal,'profile':profile,'resource_catalog':[{'id':r['id'],'status':r['status'],'eligibility':r['eligibility'],'tasks':r['tasks']} for r in resources]}
    payload={'model':os.environ.get('BRUIN_JEV_MODEL','jev-latest'),'state':state,'questions':{
      'resource':{'type':'choice','instructions':'Choose the single best resource for the student goal from two distinct worlds: UCLA campus/program resources and independently operated online AI resources. Match the specific task, properties, eligibility, and access requirements before a general assistant. For single-cell/genomics/bioscience AI-agent training, prefer a directly matching QCBio workshop. For UCLA research GPU/cloud infrastructure, prefer BruinCloud. For source-grounded paper synthesis, prefer Gemini Notebook. For independent model gateways, fast inference APIs, open-model discovery, GPU cloud execution, student packs, or cloud learning credits, select the matching online resource and retain its provider requirements. Never treat faculty/staff-only access as student eligibility, never promise credits or free usage beyond the catalog, and never imply an online provider is UCLA-operated. If the best match is coming soon or requires a key, billing, verification, or an external account, its status remains visible.','criteria':criteria},
      'fit':{'type':'score','instructions':'How well does the selected resource fit the student goal?','criteria':['poor fit','partial fit','good fit','excellent fit']},
      'needs_human_help':{'type':'noul','instructions':'Does the student likely need a UCLA staff member, instructor, workshop facilitator, PI, or administrator before they can proceed?'},
      'journey_type':{'type':'choice','instructions':'Classify the student goal into the single best ordered journey archetype. This does not choose every step; deterministic code expands the archetype after classification.','criteria':{
        'ai_agent_builder':'Learn AI-agent concepts, build an agent project, choose models, and run it on compute.',
        'single_cell_research':'Learn and execute a reproducible single-cell or RNA-seq research workflow, including compute and evidence support.',
        'coding_project':'Set up student developer tooling, code, reproduce, and publish a software/research repository.',
        'gpu_compute':'Prototype a workload, estimate requirements, and move to suitable CPU/GPU/cloud infrastructure.',
        'literature_review':'Collect, ground, synthesize, and optionally automate literature or paper-review work.',
        'model_api_exploration':'Compare hosted model APIs, gateways, latency, output quality, pricing, or integration choices.',
        'cloud_learning':'Use student benefits, cloud training/labs/credits, then apply skills to a real cloud project.',
        'general_ai':'General UCLA AI discovery or learning that does not fit the more specific journeys.'}}
    }}
    headers={'Content-Type':'application/json','User-Agent':'bruin-ai-quest/0.3.1'}
    key=os.environ.get('CLASSIFIER_API_KEY') or os.environ.get('CLASSIFY_API_KEY')
    use_key = os.environ.get('VERCEL') != '1' or os.environ.get('BRUIN_USE_CLASSIFIER_KEY','0') == '1'
    if key and use_key:
        headers['Authorization']=f'Bearer {key}'
    with httpx.Client(timeout=25.0) as client:
        resp=client.post('https://classifier.dev/v1/systemone',json=payload,headers=headers); resp.raise_for_status(); data=resp.json()
    ans=data['answers']; ch=ans['resource']; probs=_normalize(ch.get('probabilities') or {r['id']:(1 if r['id']==ch.get('choice') else 0) for r in resources})
    sc=ans['fit']; raw=float(sc.get('score',0)); max_score=max(1,len(sc.get('legend',{}))-1)
    return {'resource_id':ch['choice'],'journey_type':ans.get('journey_type',{}).get('choice') or _rule_journey_type(goal),'probabilities':probs,'confidence':float(ch.get('confidence',probs.get(ch['choice'],0))),'fit_score':raw/max_score,'needs_human_help':float(ans['needs_human_help'].get('noul',0.5)),'backend':'classifier.dev','model':data.get('model',payload['model'])}


def decide(goal: str, profile: dict, resources: list[dict]) -> dict[str,Any]:
    mode=os.environ.get('BRUIN_BACKEND','classifier').lower()
    if mode in {'classifier','classifier.dev','jev'}:
        try:
            return classifier_route(goal,profile,resources)
        except Exception as exc:
            out=rule_route(goal,resources); out['backend']='rules-fallback'; out['fallback_reason']='classifier_unavailable'; return out
    return rule_route(goal,resources)
