import yfinance as yf
import json
from pathlib import Path
from time import sleep


DATA_PATH = Path(__file__).parent.parent.parent / "data" / "etfs.json"

ETFS = [
    # EUA - S&P 500, Large Cap, Setoriais, Temáticos
    "SPY", "IVV", "VOO", "VTI", "QQQ", "DIA", "IWM", "EFA", "EEM", "VWO",
    "XLF", "XLK", "XLY", "XLC", "XLI", "XLE", "XLV", "XLU", "XLB", "XLRE",
    "ARKK", "ARKG", "ARKW", "ARKF", "ARKQ", "ARKX",
    "VYM", "SCHD", "DVY", "SDY", "SPYD", "VIG", "NOBL",
    "TLT", "IEF", "SHY", "BND", "LQD", "HYG", "AGG",
    "GLD", "SLV", "GDX", "GDXJ", "IAU", "DBC", "USO", "UNG",
    "VNQ", "SCHH", "IYR", "REM", "RWR", "XLRE",
    "MTUM", "QUAL", "USMV", "SPLV", "VTV", "VOE", "VBR", "VBK",
    "SPYG", "SPYV", "VUG", "VOT", "VONV", "VIOO", "VIOV", "VIOG",
    "SPHD", "HDV", "IDV", "EFV", "EFA", "EEM", "IEMG", "VWO", "SCZ", "IEFA",
    # Brasil - principais ETFs B3
    "BOVA11.SA", "IVVB11.SA", "SMAL11.SA", "DIVO11.SA", "FIND11.SA", "XFIX11.SA",
    "BOVV11.SA", "HASH11.SA", "ECOO11.SA", "GOVE11.SA", "ISUS11.SA", "ITUB11.SA",
    "MATB11.SA", "MALL11.SA", "MILG11.SA", "PIBB11.SA", "SPXI11.SA", "TECK11.SA",
    "XINA11.SA", "XINA11.SA", "ACWI11.SA", "EURP11.SA", "JOGO11.SA", "LFTT11.SA",
    "NFTS11.SA", "USET11.SA", "BOVB11.SA", "BOVX11.SA", "BOVS11.SA", "BOVV11.SA",
    # Outros internacionais populares
    "EWZ", "FXI", "EWJ", "EWA", "EWC", "EWH", "EWS", "EWT", "EWL", "EWP", "EWI", "EWG", "EWU", "EWD", "EWN", "EWO", "EWP", "EIS", "EIRL", "EIDO", "EPI", "EPU", "EPOL", "EPHE", "EWW", "EWM", "EZA"
]

def fetch_etfs():
    etfs_data = {}

    for etf in ETFS:
        try:
            print(f"Buscando {etf}...")
            ticker = yf.Ticker(etf)
            data = ticker.history(period="1d")

            if not data.empty:
                price = round(data["Close"].iloc[-1], 2)
                currency = "USD" if ".SA" not in etf else "BRL"
                etfs_data[etf] = {
                    "price": price,
                    "currency": currency
                }
                print(f"✅ {etf}: {currency} {price}")
            else:
                print(f"⚠️ Dados não encontrados para {etf}")

            sleep(1)

        except Exception as e:
            print(f"🚨 Erro ao buscar {etf}: {str(e)}")

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(DATA_PATH, "w") as file:
        json.dump({"etfs": etfs_data}, file, indent=2)

    print(f"\n🎉 Dados salvos em {DATA_PATH}")

if __name__ == "__main__":
    fetch_etfs()