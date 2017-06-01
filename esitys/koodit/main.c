//#include <stdio.h>

volatile int arr[256] = {1, 2, 3};

int main(int argc, const char **args) {
    asm("#main");
    register int s = 0;
    for (register int i = 0; i < argc; i++)
        s += arr[i];
    asm("#end");
    return s;
    //printf("%d", s);
}
