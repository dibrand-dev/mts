import glob
import struct

def read_ole(filename):
    with open(filename, 'rb') as f:
        data = f.read()
    if data[:8] != b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1':
        return None
    sector_shift = struct.unpack('<H', data[30:32])[0]
    sector_size = 1 << sector_shift
    first_dir_sector = struct.unpack('<I', data[48:52])[0]
    fat_sectors = [
        struct.unpack('<I', data[76 + i*4 : 80 + i*4])[0]
        for i in range(109)
        if struct.unpack('<I', data[76 + i*4 : 80 + i*4])[0] not in (0xFFFFFFFD, 0xFFFFFFFF)
    ]
    fat = []
    for fs in fat_sectors:
        pos = (fs + 1) * sector_size
        sdata = data[pos : pos + sector_size]
        fat.extend(struct.unpack(f'<{len(sdata)//4}I', sdata))
    
    def get_chain(start):
        chain, curr = [], start
        while curr != 0xFFFFFFFE and curr < len(fat):
            chain.append(curr)
            curr = fat[curr]
        return chain

    dir_chain = get_chain(first_dir_sector)
    dir_data = b''.join(data[(s+1)*sector_size : (s+2)*sector_size] for s in dir_chain)
    for i in range(len(dir_data) // 128):
        entry = dir_data[i*128 : (i+1)*128]
        name_len = struct.unpack('<H', entry[64:66])[0]
        name = entry[:name_len].decode('utf-16-le', errors='ignore').rstrip('\x00')
        start_sector = struct.unpack('<I', entry[116:120])[0]
        size = struct.unpack('<I', entry[120:124])[0]
        if name in ('Workbook', 'Book'):
            wb_chain = get_chain(start_sector)
            return b''.join(data[(s+1)*sector_size : (s+2)*sector_size] for s in wb_chain)[:size]
    return None

def parse_biff_stream(wb_data):
    idx = 0
    strings = []
    numbers = []
    while idx < len(wb_data) - 4:
        rtype, rlen = struct.unpack('<HH', wb_data[idx:idx+4])
        rdata = wb_data[idx+4 : idx+4+rlen]
        if rtype == 0x00FC and len(rdata) >= 8:
            total_strings, unique_strings = struct.unpack('<II', rdata[:8])
            sidx = 8
            for _ in range(min(unique_strings, 1000)):
                if sidx >= len(rdata) - 3: break
                cch = struct.unpack('<H', rdata[sidx:sidx+2])[0]
                flags = rdata[sidx+2]
                sidx += 3
                is_16bit = (flags & 0x01) != 0
                byte_len = cch * 2 if is_16bit else cch
                if sidx + byte_len <= len(rdata):
                    try:
                        enc = 'utf-16-le' if is_16bit else 'latin1'
                        st = rdata[sidx:sidx+byte_len].decode(enc, errors='ignore').strip()
                        if st:
                            strings.append(st)
                    except: pass
                    sidx += byte_len
        elif rtype == 0x0203 and len(rdata) >= 14: # NUMBER
            row, col, xf = struct.unpack('<HHH', rdata[:6])
            val = struct.unpack('<d', rdata[6:14])[0]
            numbers.append((row, col, val))
        idx += 4 + rlen
    return strings, numbers

print('====================================================================')
print('ANÁLISIS DE ARCHIVOS DE PROFORMAS HISTÓRICAS (.XLS) EN DOCS/')
print('====================================================================')

for f in sorted(glob.glob('docs/plantillas-excel/*.xls')):
    fname = f.split('/')[-1]
    wb = read_ole(f)
    if wb:
        strs, nums = parse_biff_stream(wb)
        rates = sorted(set([round(v, 2) for r, c, v in nums if 5000 < v < 100000]))
        desc_strs = [s for s in strs if any(w in s.upper() for w in ['HORA', 'TARIFA', 'ENCARG', 'APUNT', 'FACTURAR', 'VALOR', 'REM'])]
        print(f'\n--- ARCHIVO: {fname} ---')
        print('  Valores unitarios/tarifas encontrados:', rates)
        print('  Conceptos facturados:', desc_strs[:6])

