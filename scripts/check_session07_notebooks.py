"""Validate saved notebook deliverables without starting kernels (stdlib only)."""
from pathlib import Path
import json, base64, hashlib
base = Path(__file__).resolve().parents[1] / 'public/notebooks/session07'
expected = ['01_digits_kmeans.ipynb','02_digits_mlp.ipynb','03_pytorch_gpu.ipynb','04_image_classification.ipynb']
for name in expected:
    nb = json.loads((base/name).read_text())
    assert nb['nbformat'] == 4
    figures = 0
    for i, cell in enumerate(nb['cells']):
        if cell['cell_type'] != 'code':
            continue
        source = ''.join(cell['source'])
        compile(source, name, 'exec')
        assert cell['execution_count'] > 0
        assert nb['cells'][i-1]['cell_type'] == nb['cells'][i+1]['cell_type'] == 'markdown'
        for output in cell['outputs']:
            assert output['output_type'] != 'error'
            if 'image/png' in output.get('data', {}):
                assert base64.b64decode(output['data']['image/png']).startswith(b'\x89PNG')
                figures += 1
    assert figures > 0
    print(name, 'OK;', figures, 'figures')
report = json.loads((base/'execution-report.json').read_text())
assert len(report['notebooks']) == 4
cpu = json.loads((base/'cpu-fallback-report.json').read_text())
assert cpu['measured_backends'] == ['cpu']
assert hashlib.sha256((base/'assets/astronaut.png').read_bytes()).hexdigest() == '88431cd9653ccd539741b555fb0a46b61558b301d4110412b5bc28b5e3ea6cb5'
print('CPU-only fallback and image integrity: OK')
