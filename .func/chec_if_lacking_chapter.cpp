#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
#include <cstdio>

#define PATH L"/home/khoa/OneDrive/Code/Project/Mangament/.trash/.done/Naruto/"
#define FILE_NAME_FORMAT L"chapter "


#define fs std::filesystem

std::vector<fs::path> getFolderList(std::wstring path) {
    std::vector<fs::path> folder;   
    for (const auto &entry : fs::directory_iterator(path)) {
        folder.push_back(entry.path());
    }
    return folder;
}

void checkIfLackingChapter(std::wstring path, int maxChapter) { // Nó không thể kiểm tra các chương lẻ như là 43.5

    std::vector<fs::path> list = getFolderList(path);

    for (int i = 0; i <= maxChapter; i++) {
        std::wstring sample_file_name (FILE_NAME_FORMAT + std::to_wstring(i));
        
        fs::path directory (path + sample_file_name);
        
        bool isExists = fs::exists(directory);

        if (isExists == false) {
            std::wcout << "Lacking chapter " << i << '\n';
        }
    }
    
}

int main() {
    std::wstring path = PATH;

    std::wcout << "Enter path (leave blank for default = " << PATH << "): ";
    getline(std::wcin, path);

    if (path.empty()) {
        path = PATH;
    }

    int maxChapter = 0;
    std::wcout << "Enter max chapter: ";
    std::wcin >> maxChapter;

    std::wcout << path << ' ' << maxChapter << "\n";
    
    checkIfLackingChapter(path, maxChapter);

    return 0;
}

/*
        std::wstring name(entry.filename().wstring());

        std::size_t index = name.find(FILE_NAME_FORMAT); // Kiểm tra xem liệu name có phải là folder Chương truyện hay là file pdf, cpp, ...
        // Nếu đúng thì mới kiểm tra sô thứ tự
        if (index != std::wstring::npos) {
            std::wstring sample_checking (FILE_NAME_FORMAT + L' ' + char(i + 48));
            if (sample_checking != name)  {
                std::cout << "Require chapter " << i << '\n';
            }
            i++;
        }
*/