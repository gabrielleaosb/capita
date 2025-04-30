import yfinance as yf
import json
from pathlib import Path
from time import sleep

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "stocks.json"

SYMBOLS = [
    # Principais ações brasileiras (B3)
    "PETR4.SA", "VALE3.SA", "ITUB4.SA", "BBDC4.SA", "BBAS3.SA", "ABEV3.SA", "WEGE3.SA", "CIEL3.SA", "RENT3.SA", "SUZB3.SA",
    "GGBR4.SA", "JBSS3.SA", "LREN3.SA", "RAIL3.SA", "EMBR3.SA", "AZUL4.SA", "CCRO3.SA", "EQTL3.SA", "HYPE3.SA", "IRBR3.SA",
    "MGLU3.SA", "VIIA3.SA", "B3SA3.SA", "COGN3.SA", "CYRE3.SA", "ECOR3.SA", "EGIE3.SA", "ELET3.SA", "ENBR3.SA", "FLRY3.SA",
    "GOAU4.SA", "GUAR3.SA", "HAPV3.SA", "KLBN4.SA", "LWSA3.SA", "MRFG3.SA", "MRVE3.SA", "NTCO3.SA", "PCAR3.SA", "QUAL3.SA",
    "RADL3.SA", "SANB11.SA", "SBSP3.SA", "TAEE11.SA", "TIMS3.SA", "TOTS3.SA", "UGPA3.SA", "USIM5.SA", "VIVT3.SA", "YDUQ3.SA",
    # Adicione mais ações brasileiras conforme necessário...

    # Principais ações internacionais (EUA e globais)
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "JPM", "V", "UNH", "MA", "HD", "PG", "XOM", "LLY",
    "JNJ", "MRK", "ABBV", "AVGO", "COST", "PEP", "KO", "WMT", "BAC", "DIS", "ADBE", "NFLX", "CRM", "PFE", "T", "INTC",
    "CSCO", "CMCSA", "ABT", "CVX", "MCD", "NKE", "WFC", "TMO", "DHR", "TXN", "LIN", "NEE", "PM", "ORCL", "ACN", "QCOM",
    "IBM", "AMGN", "MDT", "HON", "UNP", "LOW", "UPS", "SBUX", "CAT", "GS", "RTX", "BLK", "BA", "SPGI", "PLD", "MS", "AXP",
    "AMAT", "ISRG", "BKNG", "NOW", "LMT", "GE", "GILD", "ZTS", "MO", "DE", "SYK", "CB", "MMC", "ADP", "TGT", "MDLZ",
    # Adicione mais tickers internacionais conforme desejar...
]

def fetch_stocks():
    stocks_data = {}

    for symbol in SYMBOLS:
        try:
            print(f"Buscando {symbol}...")
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="1d")

            if not data.empty:
                price = round(data["Close"].iloc[-1], 2)
                currency = "BRL" if ".SA" in symbol else "USD"
                stocks_data[symbol] = {
                    "price": price,
                    "currency": currency
                }
                print(f"✅ {symbol}: {currency} {price}")
            else:
                print(f"⚠️ Dados não encontrados para {symbol}")

            sleep(1)

        except Exception as e:
            print(f"🚨 Erro ao buscar {symbol}: {str(e)}")

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(DATA_PATH, "w") as file:
        json.dump({"stocks": stocks_data}, file, indent=2)

    print(f"\n🎉 Dados salvos em {DATA_PATH}")

if __name__ == "__main__":
    fetch_stocks()