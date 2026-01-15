#!/usr/bin/env python3
"""
Script to re-align ELF binary segments to 16KB page size.
Modifies the p_align field in program headers from 4KB (0x1000) to 16KB (0x4000).
"""
import struct
import sys
import os

def is_elf_file(filepath):
    """Check if file is an ELF binary."""
    try:
        with open(filepath, 'rb') as f:
            magic = f.read(4)
            return magic == b'\x7fELF'
    except:
        return False

def get_elf_class(filepath):
    """Get ELF class (32-bit or 64-bit)."""
    with open(filepath, 'rb') as f:
        f.seek(4)  # Skip ELF magic
        return ord(f.read(1))  # 1 = 32-bit, 2 = 64-bit

def realign_elf(filepath):
    """Re-align ELF binary segments to 16KB."""
    if not is_elf_file(filepath):
        return False
    
    elf_class = get_elf_class(filepath)
    
    with open(filepath, 'r+b') as f:
        # Read ELF header
        f.seek(0)
        elf_header = f.read(64 if elf_class == 2 else 52)
        
        # Get program header table offset and entry size
        if elf_class == 2:  # 64-bit
            e_phoff = struct.unpack('<Q', elf_header[32:40])[0]
            e_phentsize = struct.unpack('<H', elf_header[54:56])[0]
            e_phnum = struct.unpack('<H', elf_header[56:58])[0]
            align_offset = 48  # p_align offset in 64-bit program header
        else:  # 32-bit
            e_phoff = struct.unpack('<I', elf_header[28:32])[0]
            e_phentsize = struct.unpack('<H', elf_header[42:44])[0]
            e_phnum = struct.unpack('<H', elf_header[44:46])[0]
            align_offset = 28  # p_align offset in 32-bit program header
        
        modified = False
        
        # Read and modify each program header
        for i in range(e_phnum):
            ph_offset = e_phoff + (i * e_phentsize)
            f.seek(ph_offset + align_offset)
            
            # Read current alignment
            if elf_class == 2:
                current_align = struct.unpack('<Q', f.read(8))[0]
            else:
                current_align = struct.unpack('<I', f.read(4))[0]
            
            # Only modify if it's 4KB (0x1000)
            if current_align == 0x1000:
                f.seek(ph_offset + align_offset)
                if elf_class == 2:
                    f.write(struct.pack('<Q', 0x4000))  # 16KB
                else:
                    f.write(struct.pack('<I', 0x4000))  # 16KB
                modified = True
        
        return modified

def main():
    if len(sys.argv) < 2:
        print("Usage: realign_elf.py <file.so> [file2.so ...]")
        sys.exit(1)
    
    for filepath in sys.argv[1:]:
        if not os.path.exists(filepath):
            print(f"Warning: {filepath} does not exist, skipping")
            continue
        
        try:
            if realign_elf(filepath):
                print(f"✅ Re-aligned {filepath} to 16KB")
            else:
                print(f"ℹ️  {filepath} - no changes needed or not an ELF file")
        except Exception as e:
            print(f"❌ Error processing {filepath}: {e}")

if __name__ == '__main__':
    main()





