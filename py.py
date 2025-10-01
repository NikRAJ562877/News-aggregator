import os

# Define patterns or folders to ignore
IGNORE_DIRS = {
    'node_modules', '.next', '.git', '.vscode', '__pycache__'
}

IGNORE_FILES_EXTENSIONS = {
    '.log', '.lock'
}

IGNORE_FILES_PREFIXES = {
    '.env'
}

def should_ignore(name, path, is_dir):
    if is_dir and name in IGNORE_DIRS:
        return True
    if not is_dir:
        if any(name.endswith(ext) for ext in IGNORE_FILES_EXTENSIONS):
            return True
        if any(name.startswith(prefix) for prefix in IGNORE_FILES_PREFIXES):
            return True
    return False

def print_tree(root, prefix=""):
    entries = sorted(os.listdir(root))
    entries = [e for e in entries if not should_ignore(e, os.path.join(root, e), os.path.isdir(os.path.join(root, e)))]
    
    for idx, entry in enumerate(entries):
        path = os.path.join(root, entry)
        is_dir = os.path.isdir(path)
        connector = "└── " if idx == len(entries) - 1 else "├── "
        print(prefix + connector + entry)

        if is_dir:
            extension = "    " if idx == len(entries) - 1 else "│   "
            print_tree(path, prefix + extension)

if __name__ == "__main__":
    print("Project structure:\n")
    print_tree(".")
