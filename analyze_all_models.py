import os
import glob
import re

base_dir = r"D:\SEM  6 LABs\Muqtadir ANT\CEP"
models = ["CEP", "new", "TRY2", "TRY3", "lasttry", "test", "ARRAY"]

results = {}

for m in models:
    mod_path = os.path.join(base_dir, m, "Model", "3D", "Model.mod")
    mif_path = os.path.join(base_dir, m, "ModelCache", "Model.mif")
    
    info = {"name": m, "materials": [], "bricks": [], "curves": [], "ports": [], "raw_mod_snippet": ""}
    
    if os.path.exists(mif_path):
        with open(mif_path, "r", encoding="utf-8", errors="ignore") as f:
            mif_content = f.read()
            # find materials
            for mat in re.findall(r'material "(.*?)"', mif_content):
                if mat not in info["materials"]:
                    info["materials"].append(mat)
            for eps in re.findall(r'Epsilon "(.*?)"', mif_content):
                info["materials"].append(f"Epsilon={eps}")
                
    if os.path.exists(mod_path):
        with open(mod_path, "r", encoding="utf-8", errors="ignore") as f:
            mod_content = f.read()
            
            # Find substrate dimensions
            bricks = re.findall(r'With Brick\s+(.*?)\s+End With', mod_content, re.DOTALL)
            for b in bricks:
                b_name = re.search(r'\.Name "(.*?)"', b)
                b_mat = re.search(r'\.Material "(.*?)"', b)
                b_x = re.search(r'\.Xrange "(.*?)", "(.*?)"', b)
                b_y = re.search(r'\.Yrange "(.*?)", "(.*?)"', b)
                b_z = re.search(r'\.Zrange "(.*?)", "(.*?)"', b)
                info["bricks"].append({
                    "name": b_name.group(1) if b_name else "",
                    "mat": b_mat.group(1) if b_mat else "",
                    "x": (b_x.group(1), b_x.group(2)) if b_x else (),
                    "y": (b_y.group(1), b_y.group(2)) if b_y else (),
                    "z": (b_z.group(1), b_z.group(2)) if b_z else ()
                })
            
            # Find ports
            ports = re.findall(r'With Port\s+(.*?)\s+End With', mod_content, re.DOTALL)
            for p in ports:
                p_num = re.search(r'\.PortNumber "(.*?)"', p)
                p_type = re.search(r'\.PortType "(.*?)"', p)
                info["ports"].append(p_num.group(1) if p_num else "1")
                
            info["total_lines"] = len(mod_content.splitlines())
            info["has_via"] = "via" in mod_content.lower()
            info["has_cpw"] = "cpw" in mod_content.lower() or "feed" in mod_content.lower()
            info["has_cutout"] = "cutout" in mod_content.lower() or "slit" in mod_content.lower()
            info["has_circular_slot"] = "circ" in mod_content.lower() or "cylinder" in mod_content.lower()

    results[m] = info

print("=== SUMMARY OF ALL CST MODELS ===")
for m, info in results.items():
    print(f"\n--- Model: {m} ---")
    print(f"Materials: {info['materials']}")
    print(f"Bricks count: {len(info['bricks'])}")
    for b in info['bricks']:
        print(f"  Brick: {b['name']}, Mat: {b['mat']}, X: {b['x']}, Y: {b['y']}, Z: {b['z']}")
    print(f"Features: has_via={info.get('has_via')}, has_cpw={info.get('has_cpw')}, has_cutout={info.get('has_cutout')}, has_circular_slot={info.get('has_circular_slot')}")
