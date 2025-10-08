#include <iostream>
#include <fstream>
#include <cstdio>
#include <string>
#include <vector>
#include <filesystem>

#define PATH L"/home/khoa/OneDrive/Code/Project/Mangament/server/uploads/manga/Sói Và Gia Vị/"
#define OLD_NAME L"Chương"
#define NEW_NAME L"Chapter"

#define fs std::filesystem

std::vector<fs::path> getFolderList(std::wstring path) {
    std::vector<fs::path> folder;
    for (const auto &entry : fs::directory_iterator(path)) {
        folder.push_back(entry.path());
    }
    return folder;
}

void changeFolderName(std::wstring path) {
    std::vector<fs::path> list = getFolderList(PATH);

    for (auto &entry : list) {
        std::wstring folder_name(entry.filename().wstring());
        std::size_t index = folder_name.find(OLD_NAME);
        if (index != std::wstring::npos) {
            std::wstring old_path(PATH + folder_name); // The name before change

            std::wstring old_name(OLD_NAME);  // The path before change
            folder_name.replace(index, old_name.size(), NEW_NAME); // The name after change
        
            std::wstring new_path(PATH + folder_name);  // The path after change
            std::wcout << "Before change: " << old_path << '\n';
            fs::rename(old_path, new_path);
            std::wcout << "After change: " << new_path << " [Successful]\n";
        }
    }
}


int main() {

    changeFolderName(PATH);
    return 0;
}
