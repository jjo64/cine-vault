import sys
with open('c:/Users/josue.cueva/Desktop/tfg/cine-vault/frontend/src/pages/MovieDetail.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
with open('c:/Users/josue.cueva/Desktop/tfg/cine-vault/frontend/src/pages/MovieDetail.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines[:1045] + lines[1402:])
print('Done!')
