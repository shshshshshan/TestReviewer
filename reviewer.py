import requests

# url = 'https://test-reviewer.onrender.com/submit'
url = 'http://localhost:3000/submit'

ptrs = r'''
Variable. A variable is a location in a program’s data area that has been assigned a name. For
example:
count1 db 50 ; a variable (memory allocation)
Label. If a name appears in the code area of a program, it is called a label. Labels serve as
place markers when a program needs to jump or loop from one location to another. A label
can be on a blank line by itself, or it can share a line with an instruction. In the following
example, Label1 and Label2 are labels identifying locations in a program:
Label1: mov ax,0
mov bx,0
..
Label2:
jmp Label1 ; jump to Label1
Keyword. A keyword always has some predefined meaning to the assembler. It can be an
instruction, or it can be an assembler directive. Examples are MOV, PROC, TITLE, ADD, AX,
and END. Keywords cannot be used out of context or as identifiers. In the following, the use
of add as a label is a syntax error:
add: mov ax,10
'''
sets = 1
items = 10

for i in range(1):
    response = requests.post(url, data={
        'ptrs' : ptrs, 
        'sets' : sets,
        'items' : items
        })

print(response.text)