import sys

with open("build_vivaldi_antenna.py", "r") as f:
    code = f.read()

loc = {}
exec(code, loc, loc)
macro_code = loc["generate_cst_macro"]()

with open("build_vivaldi_antenna.mcs", "w") as f:
    f.write(macro_code)

print("Saved build_vivaldi_antenna.mcs successfully!")
