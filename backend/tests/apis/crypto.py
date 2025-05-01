import yfinance as yf
import json
from pathlib import Path
from time import sleep


DATA_PATH = Path(__file__).parent.parent / "data" / "crypto.json"

CRYPTOS = [
    "BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "ADA-USD", "DOGE-USD",
    "XRP-USD", "AVAX-USD", "DOT-USD", "TRX-USD", "LINK-USD", "MATIC-USD",
    "LTC-USD", "BCH-USD", "UNI-USD", "ATOM-USD", "ETC-USD", "FIL-USD",
    "ICP-USD", "STX-USD", "APT-USD", "ARB-USD", "OP-USD", "TIA-USD"
]

def fetch_cryptos():
    crypto_data = {}

    for symbol in CRYPTOS:
        try:
            print(f"Buscando {symbol}...")
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="1d")

            if not data.empty:
                price = round(data["Close"].iloc[-1], 2)
                crypto_data[symbol] = {
                    "price": price,
                    "currency": "USD"
                }
                print(f"✅ {symbol}: USD {price}")
            else:
                print(f"⚠️ Dados não encontrados para {symbol}")

            sleep(1)

        except Exception as e:
            print(f"🚨 Erro ao buscar {symbol}: {str(e)}")

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(DATA_PATH, "w") as file:
        json.dump({"cryptos": crypto_data}, file, indent=2)

    print(f"\n🎉 Dados salvos em {DATA_PATH}")

if __name__ == "__main__":
    fetch_cryptos()