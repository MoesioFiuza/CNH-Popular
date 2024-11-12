from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging

app = FastAPI()

# Configurar CORS
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caminho para o arquivo de credenciais
ARQUIVO_CREDENCIAIS = ''
ESCOPO = ['https://www.googleapis.com/auth/spreadsheets']

credenciais = service_account.Credentials.from_service_account_file(
    ARQUIVO_CREDENCIAIS, scopes=ESCOPO)

ID_PLANILHA = ''

class DadosPlanilha(BaseModel):
    aba: str
    valores: list

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API de atualização de planilhas!"}

@app.get("/obter-planilha")
def obter_planilha(aba: str):
    try:
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()
        resultado = planilha.values().get(
            spreadsheetId=ID_PLANILHA,
            range=aba
        ).execute()
        valores = resultado.get('values', [])
        return {"status": "sucesso", "valores": valores}
    except Exception as e:
        logging.error(f"Erro ao obter a planilha: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/atualizar-planilha")
def atualizar_planilha(dados: DadosPlanilha):
    try:
        logging.info(f"Dados recebidos: {dados}")
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()
        corpo = {
            'values': dados.valores
        }
        logging.info(f"Corpo da solicitação: {corpo}")
        resultado = planilha.values().update(
            spreadsheetId=ID_PLANILHA,
            range=dados.aba,
            valueInputOption='RAW',
            body=corpo
        ).execute()
        logging.info(f"Resultado da atualização: {resultado}")

        return {"status": "sucesso", "celulasAtualizadas": resultado.get('updatedCells')}
    except Exception as e:
        logging.error(f"Erro ao atualizar a planilha: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/adicionar-linha")
def adicionar_linha(dados: DadosPlanilha):
    try:
        logging.info(f"Dados recebidos para adicionar linha: {dados}")
        servico = build('sheets', 'v4', credentials=credenciais)
        planilha = servico.spreadsheets()
        corpo = {
            'values': [[""] * len(dados.valores[0])]
        }
        logging.info(f"Corpo da solicitação para adicionar linha: {corpo}")
        resultado = planilha.values().append(
            spreadsheetId=ID_PLANILHA,
            range=dados.aba,
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=corpo
        ).execute()
        logging.info(f"Resultado da adição de linha: {resultado}")

        return {"status": "sucesso", "linhasAdicionadas": resultado.get('updates').get('updatedRows')}
    except Exception as e:
        logging.error(f"Erro ao adicionar linha na planilha: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
