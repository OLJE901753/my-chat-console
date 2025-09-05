def test_smoke_import():
    import importlib
    m = importlib.import_module('farm_ai_crew')
    assert hasattr(m, '__version__') or m is not None


