import os

# File extensions to include
extensions = (".py", ".js", ".ts", ".tsx", ".html", ".css", ".json")

output_file = "project_code.txt"

def get_tree(path, prefix=""):
    """Return a string representing the folder tree."""
    tree_str = ""
    items = sorted(os.listdir(path))
    pointers = ["├── "] * (len(items) - 1) + ["└── "]
    for pointer, name in zip(pointers, items):
        full_path = os.path.join(path, name)
        tree_str += prefix + pointer + name + "\n"
        if os.path.isdir(full_path) and name not in ["node_modules", "__pycache__", ".git"]:
            extension = "│   " if pointer == "├── " else "    "
            tree_str += get_tree(full_path, prefix + extension)
    return tree_str

with open(output_file, "w", encoding="utf-8") as outfile:
    # Write project structure first
    outfile.write("PROJECT STRUCTURE:\n\n")
    outfile.write(get_tree("."))
    outfile.write("\n\n================ CODE =================\n")

    # Then write all code files
    for root, _, files in os.walk("."):
        if any(skip in root for skip in ["node_modules", "__pycache__", ".git"]):
            continue
        for file in files:
            if file.endswith(extensions):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as infile:
                    outfile.write(f"\n\n# ==== {filepath} ====\n\n")
                    outfile.write(infile.read())