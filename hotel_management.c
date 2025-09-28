#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <mysql/mysql.h>

// 房间类型枚举
typedef enum {
    STANDARD_SINGLE = 1,    // 标准单人间
    STANDARD_DOUBLE,        // 标准双人间
    DELUXE_SINGLE,          // 豪华单人间
    DELUXE_DOUBLE,          // 豪华双人间
    SUITE                   // 套房
} RoomType;

// 房间状态枚举
typedef enum {
    AVAILABLE = 0,          // 空闲
    OCCUPIED,               // 已入住
    CLEANING,               // 清洁中
    MAINTENANCE             // 维修中
} RoomStatus;

// 客人信息结构体
typedef struct Guest {
    char name[50];          // 客人姓名
    char id_card[20];       // 身份证号
    char phone[15];         // 电话号码
    char address[100];      // 地址
} Guest;

// 房间信息结构体
typedef struct Room {
    int room_number;        // 房间号
    RoomType type;          // 房间类型
    RoomStatus status;      // 房间状态
    float price_per_night;  // 每晚价格
    Guest guest;            // 客人信息
    time_t check_in_time;   // 入住时间
    time_t check_out_time;  // 退房时间
    int is_checked_out;     // 是否已退房
    struct Room* next;      // 指向下一个房间的指针
} Room;

// 全局变量
Room* head = NULL;          // 链表头指针
MYSQL* mysql_conn = NULL;   // MySQL连接

// 函数声明
void init_database();
void load_data_from_file();
void save_data_to_file();
void insert_to_database(Room* room);
void delete_from_database(int room_number);
void update_database(Room* room);

// 菜单函数
void show_main_menu();
void show_room_type_menu();
void show_room_status_menu();

// 核心功能函数
void register_guest();
void check_out();
void search_info();
void statistics();
void sort_rooms();
void display_all_rooms();
void display_available_rooms();

// 工具函数
Room* create_room(int room_number, RoomType type, float price);
void add_room_to_list(Room* new_room);
Room* find_room(int room_number);
void delete_room_from_list(int room_number);
void free_room_list();
char* get_room_type_name(RoomType type);
char* get_room_status_name(RoomStatus status);
void print_room_info(Room* room);
void print_guest_info(Guest* guest);

int main() {
    printf("=== 酒店前台信息管理系统 ===\n");
    
    // 初始化数据库连接
    init_database();
    
    // 从文件加载数据
    load_data_from_file();
    
    int choice;
    do {
        show_main_menu();
        printf("请输入您的选择: ");
        scanf("%d", &choice);
        getchar(); // 清除缓冲区
        
        switch (choice) {
            case 1:
                register_guest();
                break;
            case 2:
                check_out();
                break;
            case 3:
                search_info();
                break;
            case 4:
                statistics();
                break;
            case 5:
                sort_rooms();
                break;
            case 6:
                display_all_rooms();
                break;
            case 7:
                display_available_rooms();
                break;
            case 0:
                printf("感谢使用酒店管理系统！\n");
                break;
            default:
                printf("无效选择，请重新输入！\n");
        }
    } while (choice != 0);
    
    // 保存数据到文件
    save_data_to_file();
    
    // 清理内存
    free_room_list();
    
    // 关闭数据库连接
    if (mysql_conn) {
        mysql_close(mysql_conn);
    }
    
    return 0;
}

// 初始化数据库连接
void init_database() {
    mysql_conn = mysql_init(NULL);
    if (mysql_conn == NULL) {
        printf("MySQL初始化失败\n");
        return;
    }
    
    if (mysql_real_connect(mysql_conn, "localhost", "root", "password", 
                          "hotel_db", 3306, NULL, 0) == NULL) {
        printf("数据库连接失败: %s\n", mysql_error(mysql_conn));
        return;
    }
    
    printf("数据库连接成功\n");
}

// 从文件加载数据
void load_data_from_file() {
    FILE* file = fopen("occupied_rooms.dat", "rb");
    if (file == NULL) {
        printf("未找到入住信息文件，将创建新文件\n");
        return;
    }
    
    Room temp_room;
    while (fread(&temp_room, sizeof(Room), 1, file) == 1) {
        Room* new_room = create_room(temp_room.room_number, temp_room.type, temp_room.price_per_night);
        if (new_room) {
            new_room->status = temp_room.status;
            new_room->guest = temp_room.guest;
            new_room->check_in_time = temp_room.check_in_time;
            new_room->check_out_time = temp_room.check_out_time;
            new_room->is_checked_out = temp_room.is_checked_out;
            add_room_to_list(new_room);
        }
    }
    
    fclose(file);
    printf("数据加载完成\n");
}

// 保存数据到文件
void save_data_to_file() {
    FILE* occupied_file = fopen("occupied_rooms.dat", "wb");
    FILE* checked_out_file = fopen("checked_out_rooms.dat", "ab");
    
    if (occupied_file == NULL || checked_out_file == NULL) {
        printf("文件操作失败\n");
        return;
    }
    
    Room* current = head;
    while (current != NULL) {
        if (current->is_checked_out) {
            // 保存退房信息
            fwrite(current, sizeof(Room), 1, checked_out_file);
            // 从数据库中删除
            delete_from_database(current->room_number);
        } else {
            // 保存未退房信息
            fwrite(current, sizeof(Room), 1, occupied_file);
            // 更新数据库
            update_database(current);
        }
        current = current->next;
    }
    
    fclose(occupied_file);
    fclose(checked_out_file);
    printf("数据保存完成\n");
}

// 显示主菜单
void show_main_menu() {
    printf("\n=== 主菜单 ===\n");
    printf("1. 客人登记\n");
    printf("2. 客人结账\n");
    printf("3. 信息查找\n");
    printf("4. 统计功能\n");
    printf("5. 排序功能\n");
    printf("6. 显示所有房间\n");
    printf("7. 显示空闲房间\n");
    printf("0. 退出系统\n");
    printf("================\n");
}

// 显示房间类型菜单
void show_room_type_menu() {
    printf("\n=== 房间类型 ===\n");
    printf("1. 标准单人间\n");
    printf("2. 标准双人间\n");
    printf("3. 豪华单人间\n");
    printf("4. 豪华双人间\n");
    printf("5. 套房\n");
    printf("================\n");
}

// 创建新房间
Room* create_room(int room_number, RoomType type, float price) {
    Room* new_room = (Room*)malloc(sizeof(Room));
    if (new_room == NULL) {
        printf("内存分配失败\n");
        return NULL;
    }
    
    new_room->room_number = room_number;
    new_room->type = type;
    new_room->status = AVAILABLE;
    new_room->price_per_night = price;
    new_room->is_checked_out = 0;
    new_room->next = NULL;
    
    return new_room;
}

// 将房间添加到链表
void add_room_to_list(Room* new_room) {
    if (head == NULL) {
        head = new_room;
    } else {
        Room* current = head;
        while (current->next != NULL) {
            current = current->next;
        }
        current->next = new_room;
    }
}

// 查找房间
Room* find_room(int room_number) {
    Room* current = head;
    while (current != NULL) {
        if (current->room_number == room_number) {
            return current;
        }
        current = current->next;
    }
    return NULL;
}

// 从链表中删除房间
void delete_room_from_list(int room_number) {
    if (head == NULL) return;
    
    if (head->room_number == room_number) {
        Room* temp = head;
        head = head->next;
        free(temp);
        return;
    }
    
    Room* current = head;
    while (current->next != NULL && current->next->room_number != room_number) {
        current = current->next;
    }
    
    if (current->next != NULL) {
        Room* temp = current->next;
        current->next = temp->next;
        free(temp);
    }
}

// 释放链表内存
void free_room_list() {
    Room* current = head;
    while (current != NULL) {
        Room* temp = current;
        current = current->next;
        free(temp);
    }
    head = NULL;
}

// 获取房间类型名称
char* get_room_type_name(RoomType type) {
    switch (type) {
        case STANDARD_SINGLE: return "标准单人间";
        case STANDARD_DOUBLE: return "标准双人间";
        case DELUXE_SINGLE: return "豪华单人间";
        case DELUXE_DOUBLE: return "豪华双人间";
        case SUITE: return "套房";
        default: return "未知类型";
    }
}

// 获取房间状态名称
char* get_room_status_name(RoomStatus status) {
    switch (status) {
        case AVAILABLE: return "空闲";
        case OCCUPIED: return "已入住";
        case CLEANING: return "清洁中";
        case MAINTENANCE: return "维修中";
        default: return "未知状态";
    }
}

// 打印房间信息
void print_room_info(Room* room) {
    printf("\n房间号: %d\n", room->room_number);
    printf("房间类型: %s\n", get_room_type_name(room->type));
    printf("房间状态: %s\n", get_room_status_name(room->status));
    printf("每晚价格: %.2f元\n", room->price_per_night);
    
    if (room->status == OCCUPIED) {
        printf("入住时间: %s", ctime(&room->check_in_time));
        print_guest_info(&room->guest);
    }
}

// 打印客人信息
void print_guest_info(Guest* guest) {
    printf("客人姓名: %s\n", guest->name);
    printf("身份证号: %s\n", guest->id_card);
    printf("电话号码: %s\n", guest->phone);
    printf("地址: %s\n", guest->address);
}

// 客人登记功能
void register_guest() {
    printf("\n=== 客人登记 ===\n");
    
    // 显示房间类型
    show_room_type_menu();
    
    int type_choice;
    printf("请选择房间类型: ");
    scanf("%d", &type_choice);
    getchar();
    
    if (type_choice < 1 || type_choice > 5) {
        printf("无效的房间类型选择\n");
        return;
    }
    
    RoomType selected_type = (RoomType)type_choice;
    
    // 显示该类型的空闲房间
    printf("\n该类型的空闲房间:\n");
    Room* current = head;
    int found = 0;
    
    while (current != NULL) {
        if (current->type == selected_type && current->status == AVAILABLE) {
            printf("房间号: %d, 价格: %.2f元/晚\n", 
                   current->room_number, current->price_per_night);
            found = 1;
        }
        current = current->next;
    }
    
    if (!found) {
        printf("该类型没有空闲房间\n");
        return;
    }
    
    // 选择房间
    int room_number;
    printf("请输入要入住的房间号: ");
    scanf("%d", &room_number);
    getchar();
    
    Room* selected_room = find_room(room_number);
    if (selected_room == NULL) {
        printf("房间不存在\n");
        return;
    }
    
    if (selected_room->status != AVAILABLE) {
        printf("该房间不可用\n");
        return;
    }
    
    // 输入客人信息
    printf("请输入客人信息:\n");
    printf("姓名: ");
    scanf("%s", selected_room->guest.name);
    getchar();
    
    printf("身份证号: ");
    scanf("%s", selected_room->guest.id_card);
    getchar();
    
    printf("电话号码: ");
    scanf("%s", selected_room->guest.phone);
    getchar();
    
    printf("地址: ");
    scanf("%s", selected_room->guest.address);
    getchar();
    
    // 更新房间状态
    selected_room->status = OCCUPIED;
    selected_room->check_in_time = time(NULL);
    selected_room->is_checked_out = 0;
    
    // 插入数据库
    insert_to_database(selected_room);
    
    printf("登记成功！\n");
    print_room_info(selected_room);
}

// 结账功能
void check_out() {
    printf("\n=== 客人结账 ===\n");
    
    int room_number;
    printf("请输入要结账的房间号: ");
    scanf("%d", &room_number);
    getchar();
    
    Room* room = find_room(room_number);
    if (room == NULL) {
        printf("房间不存在\n");
        return;
    }
    
    if (room->status != OCCUPIED) {
        printf("该房间没有客人入住\n");
        return;
    }
    
    // 显示房间信息供确认
    printf("房间信息确认:\n");
    print_room_info(room);
    
    char confirm;
    printf("确认结账？(y/n): ");
    scanf("%c", &confirm);
    getchar();
    
    if (confirm == 'y' || confirm == 'Y') {
        room->status = CLEANING;
        room->check_out_time = time(NULL);
        room->is_checked_out = 1;
        
        // 更新数据库
        update_database(room);
        
        printf("结账成功！房间已标记为清洁中\n");
    } else {
        printf("结账已取消\n");
    }
}

// 信息查找功能
void search_info() {
    printf("\n=== 信息查找 ===\n");
    printf("1. 按房间号查找\n");
    printf("2. 按客人姓名查找\n");
    printf("3. 按身份证号查找\n");
    
    int choice;
    printf("请选择查找方式: ");
    scanf("%d", &choice);
    getchar();
    
    switch (choice) {
        case 1: {
            int room_number;
            printf("请输入房间号: ");
            scanf("%d", &room_number);
            getchar();
            
            Room* room = find_room(room_number);
            if (room != NULL) {
                print_room_info(room);
            } else {
                printf("未找到该房间\n");
            }
            break;
        }
        case 2: {
            char name[50];
            printf("请输入客人姓名: ");
            scanf("%s", name);
            getchar();
            
            Room* current = head;
            int found = 0;
            while (current != NULL) {
                if (strcmp(current->guest.name, name) == 0) {
                    print_room_info(current);
                    found = 1;
                }
                current = current->next;
            }
            
            if (!found) {
                printf("未找到该客人\n");
            }
            break;
        }
        case 3: {
            char id_card[20];
            printf("请输入身份证号: ");
            scanf("%s", id_card);
            getchar();
            
            Room* current = head;
            int found = 0;
            while (current != NULL) {
                if (strcmp(current->guest.id_card, id_card) == 0) {
                    print_room_info(current);
                    found = 1;
                }
                current = current->next;
            }
            
            if (!found) {
                printf("未找到该身份证号\n");
            }
            break;
        }
        default:
            printf("无效选择\n");
    }
}

// 统计功能
void statistics() {
    printf("\n=== 统计信息 ===\n");
    
    int total_rooms = 0;
    int occupied_rooms = 0;
    int available_rooms = 0;
    int cleaning_rooms = 0;
    int maintenance_rooms = 0;
    float total_revenue = 0.0;
    
    Room* current = head;
    while (current != NULL) {
        total_rooms++;
        
        switch (current->status) {
            case OCCUPIED:
                occupied_rooms++;
                break;
            case AVAILABLE:
                available_rooms++;
                break;
            case CLEANING:
                cleaning_rooms++;
                break;
            case MAINTENANCE:
                maintenance_rooms++;
                break;
        }
        
        if (current->status == OCCUPIED) {
            time_t now = time(NULL);
            int days = (int)((now - current->check_in_time) / (24 * 3600));
            total_revenue += current->price_per_night * days;
        }
        
        current = current->next;
    }
    
    printf("总房间数: %d\n", total_rooms);
    printf("已入住房间: %d\n", occupied_rooms);
    printf("空闲房间: %d\n", available_rooms);
    printf("清洁中房间: %d\n", cleaning_rooms);
    printf("维修中房间: %d\n", maintenance_rooms);
    printf("当前收入: %.2f元\n", total_revenue);
    
    if (total_rooms > 0) {
        printf("入住率: %.2f%%\n", (float)occupied_rooms / total_rooms * 100);
    }
}

// 排序功能
void sort_rooms() {
    printf("\n=== 排序功能 ===\n");
    printf("1. 按房间号排序\n");
    printf("2. 按价格排序\n");
    printf("3. 按入住时间排序\n");
    
    int choice;
    printf("请选择排序方式: ");
    scanf("%d", &choice);
    getchar();
    
    if (head == NULL || head->next == NULL) {
        printf("房间数量不足，无需排序\n");
        return;
    }
    
    int swapped;
    Room* ptr1;
    Room* lptr = NULL;
    
    do {
        swapped = 0;
        ptr1 = head;
        
        while (ptr1->next != lptr) {
            int should_swap = 0;
            
            switch (choice) {
                case 1: // 按房间号排序
                    should_swap = ptr1->room_number > ptr1->next->room_number;
                    break;
                case 2: // 按价格排序
                    should_swap = ptr1->price_per_night > ptr1->next->price_per_night;
                    break;
                case 3: // 按入住时间排序
                    should_swap = ptr1->check_in_time > ptr1->next->check_in_time;
                    break;
                default:
                    printf("无效选择\n");
                    return;
            }
            
            if (should_swap) {
                // 交换房间信息
                Room temp = *ptr1;
                ptr1->room_number = ptr1->next->room_number;
                ptr1->type = ptr1->next->type;
                ptr1->status = ptr1->next->status;
                ptr1->price_per_night = ptr1->next->price_per_night;
                ptr1->guest = ptr1->next->guest;
                ptr1->check_in_time = ptr1->next->check_in_time;
                ptr1->check_out_time = ptr1->next->check_out_time;
                ptr1->is_checked_out = ptr1->next->is_checked_out;
                
                ptr1->next->room_number = temp.room_number;
                ptr1->next->type = temp.type;
                ptr1->next->status = temp.status;
                ptr1->next->price_per_night = temp.price_per_night;
                ptr1->next->guest = temp.guest;
                ptr1->next->check_in_time = temp.check_in_time;
                ptr1->next->check_out_time = temp.check_out_time;
                ptr1->next->is_checked_out = temp.is_checked_out;
                
                swapped = 1;
            }
            ptr1 = ptr1->next;
        }
        lptr = ptr1;
    } while (swapped);
    
    printf("排序完成！\n");
    display_all_rooms();
}

// 显示所有房间
void display_all_rooms() {
    printf("\n=== 所有房间信息 ===\n");
    
    if (head == NULL) {
        printf("暂无房间信息\n");
        return;
    }
    
    Room* current = head;
    while (current != NULL) {
        print_room_info(current);
        current = current->next;
    }
}

// 显示空闲房间
void display_available_rooms() {
    printf("\n=== 空闲房间信息 ===\n");
    
    Room* current = head;
    int found = 0;
    
    while (current != NULL) {
        if (current->status == AVAILABLE) {
            printf("房间号: %d, 类型: %s, 价格: %.2f元/晚\n", 
                   current->room_number, 
                   get_room_type_name(current->type), 
                   current->price_per_night);
            found = 1;
        }
        current = current->next;
    }
    
    if (!found) {
        printf("暂无空闲房间\n");
    }
}

// 插入数据到数据库
void insert_to_database(Room* room) {
    if (mysql_conn == NULL) return;
    
    char query[1024];
    sprintf(query, 
        "INSERT INTO rooms (room_number, room_type, status, price_per_night, "
        "guest_name, id_card, phone, address, check_in_time) "
        "VALUES (%d, %d, %d, %.2f, '%s', '%s', '%s', '%s', %ld)",
        room->room_number, room->type, room->status, room->price_per_night,
        room->guest.name, room->guest.id_card, room->guest.phone, 
        room->guest.address, room->check_in_time);
    
    if (mysql_query(mysql_conn, query) != 0) {
        printf("数据库插入失败: %s\n", mysql_error(mysql_conn));
    }
}

// 从数据库删除数据
void delete_from_database(int room_number) {
    if (mysql_conn == NULL) return;
    
    char query[256];
    sprintf(query, "DELETE FROM rooms WHERE room_number = %d", room_number);
    
    if (mysql_query(mysql_conn, query) != 0) {
        printf("数据库删除失败: %s\n", mysql_error(mysql_conn));
    }
}

// 更新数据库
void update_database(Room* room) {
    if (mysql_conn == NULL) return;
    
    char query[1024];
    sprintf(query, 
        "UPDATE rooms SET status = %d, check_out_time = %ld, is_checked_out = %d "
        "WHERE room_number = %d",
        room->status, room->check_out_time, room->is_checked_out, room->room_number);
    
    if (mysql_query(mysql_conn, query) != 0) {
        printf("数据库更新失败: %s\n", mysql_error(mysql_conn));
    }
} 