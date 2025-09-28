#include <stdio.h>
#include <stdlib.h>
#include <string.h>
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
void create_initial_rooms();
void save_data_to_file();
Room* create_room(int room_number, RoomType type, float price);
void add_room_to_list(Room* new_room);
void free_room_list();

int main() {
    printf("=== 酒店系统初始化程序 ===\n");
    
    // 初始化数据库连接
    init_database();
    
    // 创建初始房间数据
    create_initial_rooms();
    
    // 保存到文件
    save_data_to_file();
    
    // 清理内存
    free_room_list();
    
    // 关闭数据库连接
    if (mysql_conn) {
        mysql_close(mysql_conn);
    }
    
    printf("初始化完成！现在可以运行主程序了。\n");
    return 0;
}

// 初始化数据库连接
void init_database() {
    mysql_conn = mysql_init(NULL);
    if (mysql_conn == NULL) {
        printf("MySQL初始化失败\n");
        return;
    }
    
    // 尝试不同的连接方式
    if (mysql_real_connect(mysql_conn, "localhost", "root", "", 
                          "hotel", 3306, NULL, 0) == NULL) {
        printf("尝试无密码连接失败，尝试其他方式...\n");
        
        // 尝试使用sudo权限连接
        if (mysql_real_connect(mysql_conn, "localhost", "root", NULL, 
                              "hotel", 3306, NULL, 0) == NULL) {
            printf("数据库连接失败: %s\n", mysql_error(mysql_conn));
            printf("请检查MySQL服务是否运行，或手动设置root密码\n");
            return;
        }
    }
    
    printf("数据库连接成功\n");
}

// 创建初始房间数据
void create_initial_rooms() {
    printf("正在创建初始房间数据...\n");
    
    // 标准单人间 (101-110)
    for (int i = 101; i <= 110; i++) {
        Room* room = create_room(i, STANDARD_SINGLE, 199.0);
        add_room_to_list(room);
    }
    
    // 标准双人间 (201-210)
    for (int i = 201; i <= 210; i++) {
        Room* room = create_room(i, STANDARD_DOUBLE, 299.0);
        add_room_to_list(room);
    }
    
    // 豪华单人间 (301-305)
    for (int i = 301; i <= 305; i++) {
        Room* room = create_room(i, DELUXE_SINGLE, 399.0);
        add_room_to_list(room);
    }
    
    // 豪华双人间 (401-405)
    for (int i = 401; i <= 405; i++) {
        Room* room = create_room(i, DELUXE_DOUBLE, 499.0);
        add_room_to_list(room);
    }
    
    // 套房 (501-503)
    for (int i = 501; i <= 503; i++) {
        Room* room = create_room(i, SUITE, 899.0);
        add_room_to_list(room);
    }
    
    printf("创建了 %d 个房间\n", 10 + 10 + 5 + 5 + 3);
}

// 保存数据到文件
void save_data_to_file() {
    FILE* occupied_file = fopen("occupied_rooms.dat", "wb");
    
    if (occupied_file == NULL) {
        printf("文件操作失败\n");
        return;
    }
    
    Room* current = head;
    int count = 0;
    while (current != NULL) {
        fwrite(current, sizeof(Room), 1, occupied_file);
        count++;
        current = current->next;
    }
    
    fclose(occupied_file);
    printf("保存了 %d 个房间到文件\n", count);
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
    
    // 清空客人信息
    memset(&new_room->guest, 0, sizeof(Guest));
    
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