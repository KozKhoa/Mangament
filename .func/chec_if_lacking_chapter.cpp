#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
#include <cstdio>

#define PATH L"D:\\Manga\\Nhất Quỷ Nhì Ma, Thứ Ba Takagi\\"
#define FILE_NAME_FORMAT L"Chương "


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
        
        fs::path directory (PATH + sample_file_name);
        
        if (fs::exists(directory) == false) {
            std::cout << "Lacking chapter " << i << '\n';
        }
    }
    
}

int main() {
    int maxChapter = 0;
    std::cout << "Enter max chapter: " ;
    std::cin >> maxChapter;

    std::cout << "Lacking chapter: \n";
    checkIfLackingChapter(PATH, maxChapter);

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