# ==============================================================================
# CST STUDIO SUITE 2025 - AUTOMATION SCRIPT
# Title: Super Wideband Directional Compact Vivaldi Antenna (3 - 18 GHz)
# Exact 1:1 Match to IEEE MAPCON 2025 Fig. 1 & Table 1 (DIAT Pune)
# Substrate: Rogers RT6035HTC (Er = 3.6, Tand = 0.0023, h = 0.508 mm / 20 mil)
# Metallization: Copper (annealed) - Single Layer CPW Technology
# ==============================================================================

import math
import sys
import os
import time

# Ensure CST Python libraries are available
sys.path.append(r"D:\CST\AMD64\python_cst_libraries")
try:
    import cst.interface
except ImportError:
    pass

def generate_cst_macro():
    w_sub = 50.00          # Total width (mm)
    l_sub = 98.08          # Total length (mm)
    h_sub = 0.508          # Substrate height 20 mil (mm)
    Mw = 4.00              # Feed line width (mm)
    Ml = 18.09             # Vertical feed line length (mm)
    W_slot = 1.20          # Center slotline width (mm)
    g_cpw = 0.50           # CPW slot gap width (mm)
    
    Y_flare_start = 28.0   # Flare start Y (mm)
    X_flare_end = 23.5     # Aperture half-width at Y = 0 (mm)
    R_rate = 0.16          # Rate of opening R (1/mm)
    
    R_c1 = 1.80            # Circular slot 1 radius (mm)
    Y_c1 = 55.0            # Circular slot 1 Y-center (mm)
    R_c2 = 1.80            # Circular slot 2 radius (mm)
    Y_c2 = 47.0            # Circular slot 2 Y-center (mm)
    
    R_top = 6.0            # Top taper radius (mm)
    y_top_taper = l_sub - R_top # 92.08 mm
    
    # Exponential Flare Equation (Paper Eq. 1, 2, 3):
    # y(x) = C1 * exp(R * x) + C2
    x0 = W_slot / 2.0      # 0.6 mm
    x1 = X_flare_end        # 23.5 mm
    y0 = Y_flare_start      # 28.0 mm
    y1 = 0.0               # 0.0 mm
    
    denom = math.exp(R_rate * x1) - math.exp(R_rate * x0)
    c1 = (y1 - y0) / denom
    c2 = (math.exp(R_rate * x1) * y0 - math.exp(R_rate * x0) * y1) / denom

    # 1. Main Radiating Slot Cutout (Bottom Flare + Center Slot + Top Rounded Taper P2)
    slot_pts = []
    N_flare = 50
    # Right bottom flare: from x = x1 down to x = x0
    for i in range(N_flare, -1, -1):
        t = float(i) / float(N_flare)
        x_val = x0 + t * (x1 - x0)
        y_val = c1 * math.exp(R_rate * x_val) + c2
        slot_pts.append((x_val, y_val))

    # Center slotline right edge up to top taper start Y = 92.08 mm
    slot_pts.append((W_slot / 2.0, y_top_taper))

    # Top right rounded taper (curves from (0.6, 92.08) out to (6.6, 98.08) at Point P2)
    N_top = 20
    for i in range(N_top + 1):
        ang = math.pi - (float(i) / float(N_top)) * (math.pi / 2.0)
        x_val = (W_slot / 2.0 + R_top) + R_top * math.cos(ang)
        y_val = y_top_taper + R_top * math.sin(ang)
        slot_pts.append((x_val, y_val))

    # Top edge across to top-left rounded taper
    for i in range(N_top, -1, -1):
        ang = (float(i) / float(N_top)) * (math.pi / 2.0)
        x_val = -((W_slot / 2.0 + R_top) + R_top * math.cos(math.pi - ang))
        y_val = y_top_taper + R_top * math.sin(ang)
        slot_pts.append((x_val, y_val))

    # Center slotline left edge down to flare start Y = 28.0 mm
    slot_pts.append((-W_slot / 2.0, Y_flare_start))

    # Left bottom flare: from x = -x0 to x = -x1
    for i in range(0, N_flare + 1):
        t = float(i) / float(N_flare)
        x_val = x0 + t * (x1 - x0)
        y_val = c1 * math.exp(R_rate * x_val) + c2
        slot_pts.append((-x_val, y_val))

    # Bottom aperture edge closure
    slot_pts.append((-X_flare_end, 0.0))
    slot_pts.append((X_flare_end, 0.0))
    slot_pts.append(slot_pts[0])

    slot_pts_cmds = "\n".join([f'    .Point "{pt[0]:.6f}", "{pt[1]:.6f}"' for pt in slot_pts])

    # 2. Four Wide Curved Side Cutouts (Curving UP and IN matching Fig. 1)
    def make_wide_cutout(poly_name, sheet_name, y_base, sign):
        pts = []
        for i in range(25):
            u = float(i) / 24.0
            x = sign * (23.5 - 16.5 * (u ** 0.85))
            y = y_base + 18.0 * (u ** 1.6)
            pts.append((x, y))
        for i in range(24, -1, -1):
            u = float(i) / 24.0
            x = sign * (23.5 - 16.5 * (u ** 0.85))
            y = (y_base + 5.5) + 18.0 * (u ** 1.6)
            pts.append((x, y))
        pts.append(pts[0])

        pts_str = "\n".join([f'    .Point "{pt[0]:.6f}", "{pt[1]:.6f}"' for pt in pts])
        return f'''
With Polygon
    .Reset
    .Name "{poly_name}"
    .Curve "Vivaldi_Curves"
{pts_str}
    .Create
End With

With CoverCurve
    .Reset
    .Name "{sheet_name}"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Curve "Vivaldi_Curves:{poly_name}"
    .Create
End With
Solid.Subtract "Vivaldi:Radiator_Ground", "Vivaldi:{sheet_name}"'''

    cutouts_block = "\n".join([
        make_wide_cutout("Poly_Cutout_UR", "Cutout_UR", 32.0, 1.0),
        make_wide_cutout("Poly_Cutout_UL", "Cutout_UL", 32.0, -1.0),
        make_wide_cutout("Poly_Cutout_LR", "Cutout_LR", 10.0, 1.0),
        make_wide_cutout("Poly_Cutout_LL", "Cutout_LL", 10.0, -1.0)
    ])

    cst_commands = f'''
' --- Full Cleanup of Old Components ---
On Error Resume Next
Solid.Delete "Antenna:Radiator_Ground"
Solid.Delete "Antenna:Substrate"
Solid.Delete "Vivaldi:Radiator_Ground"
Solid.Delete "Vivaldi:Substrate"
Component.Delete "Antenna"
Component.Delete "Vivaldi"
Curve.DeleteCurve "Antenna_Curves"
Curve.DeleteCurve "Vivaldi_Curves"
Port.Delete "1"
Monitor.Delete "Farfield (f=3 GHz)"
Monitor.Delete "Farfield (f=5 GHz)"
Monitor.Delete "Farfield (f=9 GHz)"
Monitor.Delete "Farfield (f=13 GHz)"
Monitor.Delete "Farfield (f=18 GHz)"
On Error GoTo 0

' --- Create Clean Component Vivaldi ---
Component.New "Vivaldi"

' --- Units ---
With Units
    .Geometry "mm"
    .Frequency "GHz"
    .Time "ns"
End With

Solver.FrequencyRange "2.5", "19.0"

' --- Rogers RT6035HTC Substrate Material ---
On Error Resume Next
Material.Delete "Rogers_RT6035HTC"
On Error GoTo 0

With Material
    .Reset
    .Name "Rogers_RT6035HTC"
    .Folder ""
    .FrqType "all"
    .Type "Normal"
    .SetMaterialUnit "GHz", "mm"
    .Epsilon "3.6"
    .Mue "1.0"
    .TanD "0.0023"
    .TanDFreq "10.0"
    .TanDGiven "True"
    .TanDModel "ConstTanD"
    .Colour "0.85", "0.85", "0.85"
    .Wireframe "False"
    .Create
End With

' --- Substrate Brick (Z = -h to 0) ---
With Brick
    .Reset
    .Name "Substrate"
    .Component "Vivaldi"
    .Material "Rogers_RT6035HTC"
    .Xrange "{-w_sub/2:.4f}", "{w_sub/2:.4f}"
    .Yrange "0.0", "{l_sub:.4f}"
    .Zrange "{-h_sub:.4f}", "0.0"
    .Create
End With

' --- Golden Copper Radiator Sheet (Z = 0) ---
With Brick
    .Reset
    .Name "Radiator_Ground"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{-w_sub/2:.4f}", "{w_sub/2:.4f}"
    .Yrange "0.0", "{l_sub:.4f}"
    .Zrange "0.0", "0.0"
    .Create
End With

' --- Curve Container (Z = 0) ---
With Curve
    .NewCurve "Vivaldi_Curves"
End With

' --- Main Vivaldi Flare + Top Rounded Taper (P2) Cutout (Z = 0) ---
With Polygon
    .Reset
    .Name "Slot_Poly"
    .Curve "Vivaldi_Curves"
{slot_pts_cmds}
    .Create
End With

With CoverCurve
    .Reset
    .Name "Slot_Sheet"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Curve "Vivaldi_Curves:Slot_Poly"
    .Create
End With
Solid.Subtract "Vivaldi:Radiator_Ground", "Vivaldi:Slot_Sheet"

' --- Four Wide Curved Side Cutouts (Z = 0) ---
{cutouts_block}

' --- 2 High-Frequency Circular Slots on Center Slot (Z = 0) ---
With Cylinder
    .Reset
    .Name "Circ1_Cutout"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .OuterRadius "{R_c1:.4f}"
    .InnerRadius "0.0"
    .Axis "z"
    .Zrange "0.0", "0.0"
    .Xcenter "0.0"
    .Ycenter "{Y_c1:.4f}"
    .Segments "0"
    .Create
End With
Solid.Subtract "Vivaldi:Radiator_Ground", "Vivaldi:Circ1_Cutout"

With Cylinder
    .Reset
    .Name "Circ2_Cutout"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .OuterRadius "{R_c2:.4f}"
    .InnerRadius "0.0"
    .Axis "z"
    .Zrange "0.0", "0.0"
    .Xcenter "0.0"
    .Ycenter "{Y_c2:.4f}"
    .Segments "0"
    .Create
End With
Solid.Subtract "Vivaldi:Radiator_Ground", "Vivaldi:Circ2_Cutout"

' --- Bottom Corner Notches (2.5 mm x 3.5 mm) ---
With Brick
    .Reset
    .Name "Notch_L"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{-w_sub/2:.4f}", "{-w_sub/2 + 2.5:.4f}"
    .Yrange "0.0", "3.5"
    .Zrange "0.0", "0.0"
    .Create
End With
Solid.Subtract "Vivaldi:Radiator_Ground", "Vivaldi:Notch_L"

With Brick
    .Reset
    .Name "Notch_R"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{w_sub/2 - 2.5:.4f}", "{w_sub/2:.4f}"
    .Yrange "0.0", "3.5"
    .Zrange "0.0", "0.0"
    .Create
End With
Solid.Subtract "Vivaldi:Radiator_Ground", "Vivaldi:Notch_R"

' --- CPW Feed Isolation Slot Cutouts (L-shaped gaps on Top Left) ---
With Brick
    .Reset
    .Name "CPW_Gap_Out_V"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{-22.0 - g_cpw:.4f}", "{-22.0:.4f}"
    .Yrange "{78.0 - g_cpw:.4f}", "{l_sub:.4f}"
    .Zrange "0.0", "0.0"
    .Create
End With

With Brick
    .Reset
    .Name "CPW_Gap_Out_H"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{-22.0 - g_cpw:.4f}", "{-W_slot/2:.4f}"
    .Yrange "{78.0 - g_cpw:.4f}", "{78.0:.4f}"
    .Zrange "0.0", "0.0"
    .Create
End With

Solid.Add "Vivaldi:CPW_Gap_Out_V", "Vivaldi:CPW_Gap_Out_H"
Solid.Subtract "Vivaldi:Radiator_Ground", "Vivaldi:CPW_Gap_Out_V"

With Brick
    .Reset
    .Name "CPW_Gap_In_V"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{-18.0:.4f}", "{-18.0 + g_cpw:.4f}"
    .Yrange "{82.0:.4f}", "{l_sub:.4f}"
    .Zrange "0.0", "0.0"
    .Create
End With

With Brick
    .Reset
    .Name "CPW_Gap_In_H"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{-18.0:.4f}", "{-W_slot/2:.4f}"
    .Yrange "{82.0:.4f}", "{82.0 + g_cpw:.4f}"
    .Zrange "0.0", "0.0"
    .Create
End With

Solid.Add "Vivaldi:CPW_Gap_In_V", "Vivaldi:CPW_Gap_In_H"
Solid.Subtract "Vivaldi:Radiator_Ground", "Vivaldi:CPW_Gap_In_V"

' --- L-Shaped CPW Feed Line Solid (Crossing over slot to Right Wing) ---
With Brick
    .Reset
    .Name "CPW_Feed_V"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{-22.0:.4f}", "{-18.0:.4f}"
    .Yrange "{82.0:.4f}", "{l_sub:.4f}"
    .Zrange "0.0", "0.0"
    .Create
End With

With Brick
    .Reset
    .Name "CPW_Feed_H"
    .Component "Vivaldi"
    .Material "Copper (annealed)"
    .Xrange "{-22.0:.4f}", "{W_slot/2 + 2.5:.4f}"
    .Yrange "{78.0:.4f}", "{82.0:.4f}"
    .Zrange "0.0", "0.0"
    .Create
End With

Solid.Add "Vivaldi:CPW_Feed_V", "Vivaldi:CPW_Feed_H"
Solid.Add "Vivaldi:Radiator_Ground", "Vivaldi:CPW_Feed_V"

' --- Surrounding Boundaries (Open Add Space) ---
With Boundary
    .Xmin "expanded open"
    .Xmax "expanded open"
    .Ymin "expanded open"
    .Ymax "expanded open"
    .Zmin "expanded open"
    .Zmax "expanded open"
End With

' --- Waveguide Port on Top Left CPW Feed (Y = l_sub = 98.08 mm) ---
With Port
    .Reset
    .PortNumber "1"
    .Label "Feed_Port"
    .NumberOfModes "1"
    .AdjustPolarization "False"
    .PolarizationAngle "0.0"
    .ReferencePlaneDistance "0"
    .Coordinates "Free"
    .Orientation "Ymax"
    .PortOnBound "False"
    .Xrange "{-23.5:.4f}", "{-16.5:.4f}"
    .Zrange "{-h_sub - 0.5:.4f}", "{0.5:.4f}"
    .Yrange "{l_sub:.4f}", "{l_sub:.4f}"
    .Create
End With

' --- Farfield Monitors (3, 5, 9, 13, 18 GHz) ---
With Monitor
    .Reset
    .Name "Farfield (f=3 GHz)"
    .Dimension "Volume"
    .Domain "Frequency"
    .FieldType "Farfield"
    .Frequency "3.0"
    .Create
End With

With Monitor
    .Reset
    .Name "Farfield (f=5 GHz)"
    .Dimension "Volume"
    .Domain "Frequency"
    .FieldType "Farfield"
    .Frequency "5.0"
    .Create
End With

With Monitor
    .Reset
    .Name "Farfield (f=9 GHz)"
    .Dimension "Volume"
    .Domain "Frequency"
    .FieldType "Farfield"
    .Frequency "9.0"
    .Create
End With

With Monitor
    .Reset
    .Name "Farfield (f=13 GHz)"
    .Dimension "Volume"
    .Domain "Frequency"
    .FieldType "Farfield"
    .Frequency "13.0"
    .Create
End With

With Monitor
    .Reset
    .Name "Farfield (f=18 GHz)"
    .Dimension "Volume"
    .Domain "Frequency"
    .FieldType "Farfield"
    .Frequency "18.0"
    .Create
End With
'''
    return cst_commands

def main():
    cst_macro = generate_cst_macro()
    title = f"Build Exact Fig1 Vivaldi Antenna ({int(time.time())})"

    # Save to disk
    with open(r"C:\Users\ali24\Documents\anti\build_vivaldi_antenna.mcs", "w") as f:
        f.write(cst_macro)

    # Direct connection via cst.interface
    try:
        de = cst.interface.DesignEnvironment.connect_to_any()
        prj = de.active_project()
        if prj:
            m3d = prj.model3d
            m3d.add_to_history(title, cst_macro)
            m3d.full_history_rebuild()
            m3d.SelectTreeItem("Components\\Vivaldi\\Radiator_Ground")
            print("\n========================================================")
            print(">>> SUCCESS: Exact Fig. 1 Vivaldi Antenna & Port 1 Built & Rebuilt in CST!")
            print("========================================================")
            return
    except Exception as e:
        print(f"Direct API info: {e}")

    # Fallback to iShell objects
    import __main__
    for scope in [globals(), locals(), vars(__main__)]:
        for name in ['modeler', 'model3d', 'prj', 'project', 'mws', 'app']:
            if name in scope:
                obj = scope[name]
                for target_attr in ['model3d', 'modeler']:
                    if hasattr(obj, target_attr):
                        sub_obj = getattr(obj, target_attr)
                        if hasattr(sub_obj, 'add_to_history'):
                            sub_obj.add_to_history(title, cst_macro)
                            if hasattr(sub_obj, 'full_history_rebuild'):
                                sub_obj.full_history_rebuild()
                            if hasattr(sub_obj, 'SelectTreeItem'):
                                sub_obj.SelectTreeItem("Components\\Vivaldi\\Radiator_Ground")
                            print("\n========================================================")
                            print(f">>> SUCCESS: Built & Rebuilt via iShell '{name}.{target_attr}'!")
                            print("========================================================")
                            return

main()
