import os
import shutil

r_dir = r"c:\Users\ali24\Documents\anti\report_data"

# Map screenshots to their technical roles:
mapping = {
    "Screenshot 2026-08-23 152058.png": "Model1_Microstrip_Duroid5880_CAD.png",
    "Screenshot 2026-08-23 190240.png": "Model1_S11_Duroid5880.png",
    "Screenshot 2026-08-23 191121.png": "Model2_CPW_Unmatched_S11.png",
    "Screenshot 2026-08-23 220606.png": "Model3_CPW_CavityHole_CAD.png",
    "Screenshot 2026-08-24 003214.png": "Model3_S11_StandingWave.png",
    "Screenshot 2026-08-24 003900.png": "Model3_Intermediate_S11.png",
    "Screenshot 2026-08-24 012215.png": "Model4_Fig1_Rebuilt_CAD.png",
    "Screenshot 2026-08-24 155404.png": "Model4_Final_Optimized_S11.png"
}

for src, dst in mapping.items():
    s_path = os.path.join(r_dir, src)
    d_path = os.path.join(r_dir, dst)
    if os.path.exists(s_path):
        shutil.copyfile(s_path, d_path)
        print(f"Mapped {src} -> {dst}")
