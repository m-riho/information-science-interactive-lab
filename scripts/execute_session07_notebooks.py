"""Execute and validate the four notebooks, preserving real outputs."""
from pathlib import Path
import json
import os
import nbformat
from nbclient import NotebookClient
ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "public/notebooks/session07"
report = []
cpu_check = os.environ.get("A07_FORCE_CPU") == "1"
for path in sorted(BASE.glob("03_pytorch_gpu.ipynb" if cpu_check else "*.ipynb")):
    print("Executing", path.name, flush=True)
    notebook = nbformat.read(path, as_version=4)
    NotebookClient(notebook, timeout=240, kernel_name="python3",
                   resources={"metadata":{"path":str(BASE)}}).execute()
    if not cpu_check:
        nbformat.write(notebook, path)
    errors = [o for c in notebook.cells if c.cell_type=="code" for o in c.outputs if o.output_type=="error"]
    assert not errors
    count = sum(c.cell_type=="code" for c in notebook.cells)
    # NB04 must actually perform pretrained inference in the saved deliverable.
    if path.name.startswith("04"):
        text = "\n".join(o.get("text","") for c in notebook.cells if c.cell_type=="code" for o in c.outputs)
        assert "推論をスキップしました" not in text
        assert "学習済み重み: ResNet18_Weights.IMAGENET1K_V1" in text
        assert any("display_data" == o.output_type for c in notebook.cells if c.cell_type=="code" for o in c.outputs)
    if path.name.startswith("03"):
        stream = "\n".join(o.get("text", "") for c in notebook.cells if c.cell_type=="code" for o in c.outputs)
        backends = [d for d in ["cpu","mps","cuda"] if "'device': '"+d+"'" in stream]
        if cpu_check: assert backends == ["cpu"]
    report.append({"file":path.name,"executed_code_cells":count,"errors":0,
                   "figures":sum("image/png" in o.get("data",{}) for c in notebook.cells if c.cell_type=="code" for o in c.outputs)})
    print("Completed", path.name, flush=True)
(BASE/("cpu-fallback-report.json" if cpu_check else "execution-report.json")).write_text(json.dumps({"python":"3.13.5","measured_backends":backends,"notebooks":report},ensure_ascii=False,indent=2)+"\n")
