import os

# File extensions to include
extensions = (".py", ".js", ".ts", ".tsx", ".html", ".css", ".json")

# Files to explicitly skip (lockfiles, large auto-generated files, old exports, etc.)
skip_files = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "Pipfile.lock",
    "igjf/app/project_code1.txt",  # old code base
    "igjf/app/project_code2.txt",  # old code base
    "igjf/app/rebuild_mobile_app.py"
    "igjf/app/combine.py" # current script
}

# Folders to skip
skip_dirs = {"node_modules", "__pycache__", ".git"}

output_file = "project_code_deploy.txt"

def get_tree(path, prefix=""):
    """Return a string representing the folder tree."""
    tree_str = ""
    items = sorted(os.listdir(path))
    pointers = ["├── "] * (len(items) - 1) + ["└── "]
    for pointer, name in zip(pointers, items):
        full_path = os.path.join(path, name)
        if name in skip_dirs or full_path.replace("\\", "/") in skip_files:
            continue
        tree_str += prefix + pointer + name + "\n"
        if os.path.isdir(full_path):
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
        if any(skip in root for skip in skip_dirs):
            continue
        for file in files:
            full_path = os.path.join(root, file)
            normalized_path = full_path.replace("\\", "/")
            if file in skip_files or normalized_path in skip_files:
                continue
            if file.endswith(extensions):
                try:
                    with open(full_path, "r", encoding="utf-8") as infile:
                        outfile.write(f"\n\n# ==== {normalized_path} ====\n\n")
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"\n\n# ==== {normalized_path} (ERROR READING: {e}) ====\n\n")
