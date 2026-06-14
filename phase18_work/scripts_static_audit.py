from pathlib import Path
import json, re, sys, yaml
root = Path('.')
errors = []

# JSON files
for p in [root/'backend/package.json', root/'backend/package-lock.json', root/'frontend/package.json', root/'frontend/package-lock.json']:
    try:
        json.loads(p.read_text())
    except Exception as e:
        errors.append(f'Invalid JSON: {p}: {e}')

# Compose YAML
try:
    yaml.safe_load((root/'docker-compose.yml').read_text())
except Exception as e:
    errors.append(f'Invalid docker-compose.yml: {e}')

# Internal registry
for p in [root/'backend/package-lock.json', root/'frontend/package-lock.json']:
    txt = p.read_text(errors='ignore')
    for bad in ['packages.applied-caas', 'internal.api.openai', 'artifactory/api/npm']:
        if bad in txt:
            errors.append(f'Internal registry leaked in {p}: {bad}')

# Prisma enum default validation
schema = (root/'backend/prisma/schema.prisma').read_text()
enums = {}
for m in re.finditer(r'enum\s+(\w+)\s*\{([^}]*)\}', schema, re.S):
    vals = []
    for line in m.group(2).splitlines():
        line = line.split('//')[0].strip()
        if line and not line.startswith('@'):
            vals.append(line.split()[0])
    enums[m.group(1)] = set(vals)

for model in re.finditer(r'model\s+(\w+)\s*\{([^}]*)\}', schema, re.S):
    model_name = model.group(1)
    for line in model.group(2).splitlines():
        clean = line.split('//')[0].strip()
        if not clean:
            continue
        parts = clean.split()
        if len(parts) < 2:
            continue
        field = parts[0]
        type_name = parts[1].rstrip('?').rstrip('[]')
        if type_name in enums:
            default = re.search(r'@default\(([^)]+)\)', clean)
            if default:
                value = default.group(1).strip().strip('"')
                if value not in enums[type_name]:
                    errors.append(f'Bad enum default: {model_name}.{field} {type_name} @default({value})')

# Active code old roles/status values
active_files = list((root/'backend/src').rglob('*.*')) + list((root/'frontend/src').rglob('*.*')) + [root/'backend/prisma/seed.js']
old_terms = ['SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'MODERATOR', 'CUSTOMER', 'APPROVED', 'REJECTED']
for p in active_files:
    if p.is_file():
        txt = p.read_text(errors='ignore')
        for term in old_terms:
            if re.search(r'\b' + re.escape(term) + r'\b', txt):
                errors.append(f'Old term {term} found in active code: {p}')

if errors:
    print('STATIC AUDIT FAILED')
    for e in errors:
        print('-', e)
    sys.exit(1)
print('STATIC AUDIT PASSED')
