#!/usr/bin/env python3
"""Rebuild, test and assert the two Qwen Max audits, with Chromium by default."""
import importlib.util
import sys
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('terra_audit_runner', Path(__file__).with_name('run-gpt56-terra-audit.py'))
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
if __name__ == '__main__':
    raise SystemExit(runner.main('qwen'))
