import unittest

from backend.benchmark import cases, greedy_plan, offline_matrix, run_benchmark
from backend.planning_catalog import load_planning_catalog
from backend.planning_models import PlanRequest
from backend.planning import verify_plan


class BenchmarkTests(unittest.TestCase):
    def test_fixed_cases_and_matrix(self):
        places, _, _ = load_planning_catalog("Đà Nẵng")
        self.assertEqual(len(list(cases(places))), 36)
        matrix = offline_matrix(places)
        self.assertEqual(len(matrix), len(places) * (len(places) - 1))
        self.assertTrue(all(leg.distanceMeters >= 0 and leg.durationMs >= 0 for leg in matrix.values()))

    def test_greedy_preserves_constraints(self):
        places, _, _ = load_planning_catalog("Đà Nẵng")
        matrix = offline_matrix(places)
        for request in cases(places):
            result = greedy_plan(request, places, matrix)
            if result.status == "PLANNED_ESTIMATE":
                verify_plan(result, places)
            else:
                self.assertIn(result.status, {"INFEASIBLE", "SEARCH_LIMIT"})

    def test_report_uses_paired_denominator(self):
        report = run_benchmark()
        self.assertEqual(len(report["cases"]), 36)
        self.assertEqual(report["summary"]["beam"]["cases"], 36)
        paired = [row for row in report["cases"] if all(row["results"][name]["valid"] for name in ("beam", "greedy"))]
        self.assertEqual(report["summary"]["pairedFeasibleCases"], len(paired))
        self.assertGreater(len(paired), 0)
        self.assertEqual(report["method"]["catalogAssumptionVersion"], "planning-assumptions-v1")


if __name__ == "__main__":
    unittest.main()
