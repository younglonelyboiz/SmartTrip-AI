"""Validate target API and all shared JSON fixtures; no backend required."""
from pathlib import Path
import json
import yaml
from openapi_spec_validator import validate_spec
from jsonschema import Draft202012Validator
ROOT=Path(__file__).resolve().parents[1]
api=yaml.safe_load((ROOT/'docs/api/openapi.yaml').read_text())
validate_spec(api)
schemas=api['components']['schemas']
expected={'FEASIBLE','OPTIMAL','INFEASIBLE','TIMEOUT_WITH_SOLUTION','TIMEOUT_NO_SOLUTION','INVALID_INPUT','DATA_ERROR'}
assert set(schemas['SolverStatus']['enum'])==expected
# Resolve local refs once to validate fixture schemas independent of network.
def expand(value):
    if isinstance(value,list):return [expand(v) for v in value]
    if isinstance(value,dict):
        if '$ref' in value:return expand(schemas[value['$ref'].rsplit('/',1)[1]])
        return {k:expand(v) for k,v in value.items()}
    return value
fixture=json.loads((ROOT/'frontend/src/mocks/scenarios.json').read_text())
Draft202012Validator(expand(schemas['DatasetSnapshot'])).validate(fixture['snapshot'])
for s in fixture['scenarios']:
    Draft202012Validator(expand(schemas['TravelRequest'])).validate(s['request'])
    Draft202012Validator(expand(schemas['OptimizationResult'])).validate(s['result'])
    if 'baseline' in s:Draft202012Validator(expand(schemas['PlanVersion'])).validate(s['baseline'])
print(f'PASS: OpenAPI 3.1, {len(api["paths"])} paths, schemas and {len(fixture["scenarios"])} fixtures')
