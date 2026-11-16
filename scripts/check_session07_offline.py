"""Execute NB04 with simulated offline downloads and an empty cache."""
import json, tempfile
from pathlib import Path
import nbformat
from nbclient import NotebookClient
root = Path(__file__).resolve().parents[1]
base = root / "public/notebooks/session07"
nb = nbformat.read(base/"04_image_classification.ipynb",as_version=4)
setup = nbformat.v4.new_code_cell("""
from unittest.mock import patch
from pathlib import Path
import torch.hub
torch.hub.set_dir(str(Path.cwd() / "empty-hub"))
patch("urllib.request.urlopen", side_effect=OSError("simulated offline")).start()
patch("torch.hub.download_url_to_file", side_effect=OSError("simulated offline")).start()
""")
nb.cells.insert(0, setup)
with tempfile.TemporaryDirectory(prefix="a07-offline-") as directory:
    NotebookClient(nb,timeout=120,kernel_name="python3",resources={"metadata":{"path":directory}}).execute()
text = "\n".join(o.get("text","") for c in nb.cells if c.cell_type=="code" for o in c.outputs)
assert "画像が読めません" in text
assert "学習済み重みを取得できません" in text
assert "推論をスキップしました" in text
(base/"offline-report.json").write_text(json.dumps({"file":"04_image_classification.ipynb","mode":"simulated offline, empty image/weight cache","completed":True,"pretrained_inference_skipped":True},ensure_ascii=False,indent=2)+"\n")
print("NB04 offline behavior: completed without substituting untrained weights")
