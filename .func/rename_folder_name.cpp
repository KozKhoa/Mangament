#include <iostream>
#include <fstream>
#include <cstdio>
#include <string>
#include <vector>
#include <filesystem>

#define PATH L"D:\\Manga\\The Fragrant Flower Blooms With Dignity - Kaoru Hana Wa Rin To Saku\\"
#define OLD_NAME L"Chương"
#define NEW_NAME L"chapter"

#define fs std::filesystem

std::vector<fs::path> getFolderList(std::wstring path) {
    std::vector<fs::path> folder;   
    for (const auto &entry : fs::directory_iterator(path)) {
        folder.push_back(entry.path());
    }
    return folder;
}

void changeFolderName(std::wstring path, std::wstring old_name = OLD_NAME, std::wstring new_name = NEW_NAME) {
    std::vector<fs::path> list = getFolderList(path);

    for (auto &entry : list) {
        std::wstring folder_name(entry.filename().wstring());
        std::size_t index = folder_name.find(old_name);
        if (index != std::wstring::npos) {
            std::wstring old_path(path + folder_name); // The name before change

            folder_name.replace(index, old_name.size(), new_name); // The name after change
        
            std::wstring new_path(path + folder_name);  // The path after change
            std::wcout << "Before change: " << old_path << '\n';
            fs::rename(old_path, new_path);
            std::wcout << "After change: " << new_path << " [Successful]\n\n";
        }
    }
}


int main() {


    std::wstring path = PATH;
    std::wstring old_name = OLD_NAME;
    std::wstring new_name = NEW_NAME;

    std::wcout << L"Path: (" << PATH << "): ";
    getline(std::wcin, path);

    if (path.empty()) {
        path = PATH;
    }

    std::wcout << L"Old name (" << OLD_NAME << "): ";
    getline(std::wcin, old_name);

    if (old_name.empty()) {
        old_name = OLD_NAME;
    }


    std::wcout << L"New name (" << NEW_NAME << "): ";
    getline(std::wcin, new_name);

    if (new_name.empty()) {
        new_name = NEW_NAME;
    }


    changeFolderName(path, old_name, new_name);
    return 0;
}