import json
from pathlib import Path
from time import sleep
import requests
from bs4 import BeautifulSoup

DATA_PATH = Path(__file__).parent.parent / "data" / "fiis.json"

def get_all_fiis():
    return [
        "MXRF11", "HGLG11", "KNRI11", "VISC11", "XPLG11", "VILG11", "HGBS11", "XPML11", "BCFF11",
        "RECT11", "RBRF11", "RBRP11", "RBRR11", "RBRL11", "RBRY11", "RBRM11", "RBRX11", "RBRI11",
        "RBRD11", "RBRH11", "RBRQ11", "RBRU11", "RBRV11", "RBRZ11", "BCIA11", "BRCR11", "BTLG11",
        "BTCR11", "CPTS11", "CVBI11", "DEVA11", "FIIB11", "GALG11", "GGRC11", "HCTR11", "HGCR11",
        "HGFF11", "HGPO11", "HSML11", "IRDM11", "JSRE11", "KFOF11", "LVBI11", "MALL11", "MCCI11",
        "MGCR11", "MGFF11", "MORE11", "NVHO11", "PATC11", "PLCR11", "PLRI11", "PVBI11", "QAGR11",
        "QAMI11", "QCOM11", "QCRI11", "QIFI11", "QIR11", "RECR11", "RZAK11", "RZTR11", "SADI11",
        "SDIL11", "SNCI11", "SPTW11", "TRXF11", "URPR11", "VGIR11", "VGHF11", "VGIP11", "VINO11",
        "VISC11", "VIUR11", "VRTA11", "VSLH11", "VTLT11", "XPCA11", "XPCI11", "XPIN11", "XPLG11", "XPML11"
    ]

def get_fii_price_fundsexplorer(ticker):
    url = f"https://www.fundsexplorer.com.br/funds/{ticker.lower()}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            price_div = soup.find("div", class_="headerTicker__content__price")
            if price_div:
                price_p = price_div.find("p")
                if price_p:
                    price = price_p.text.strip().replace("R$", "").replace(",", ".")
                    try:
                        return float(price)
                    except:
                        return None
    except Exception as e:
        print(f"Erro ao buscar {ticker} no FundosExplorer: {e}")
    return None

def fetch_fiis():
    fiis_data = {}
    fiis = get_all_fiis()
    print(f"Total de FIIs encontrados: {len(fiis)}")

    for fii in fiis:
        print(f"Buscando {fii}...")
        price = get_fii_price_fundsexplorer(fii)
        if price is not None:
            fiis_data[fii + ".SA"] = {
                "price": price,
                "currency": "BRL"
            }
            print(f"✅ {fii}: R${price}")
        else:
            print(f"⚠️ Dados não encontrados para {fii}")
        sleep(1)

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_PATH, "w") as file:
        json.dump({"fiis": fiis_data}, file, indent=2)
    print(f"\n🎉 Dados salvos em {DATA_PATH}")

if __name__ == "__main__":
    fetch_fiis()