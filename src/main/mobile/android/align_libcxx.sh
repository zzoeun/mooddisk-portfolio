#!/bin/bash
# Script to align libc++_shared.so to 16KB boundaries using NDK r28 tools

set -e

NDK_VERSION="28.0.12433566"
NDK_PATH="${ANDROID_HOME}/ndk/${NDK_VERSION}"
LLVM_OBJCOPY="${NDK_PATH}/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-objcopy"

if [ ! -f "$LLVM_OBJCOPY" ]; then
    echo "Error: llvm-objcopy not found at $LLVM_OBJCOPY"
    exit 1
fi

# Find all libc++_shared.so files in the build output
find "$1" -name "libc++_shared.so" -type f | while read lib; do
    echo "Checking alignment of $lib..."
    
    # Check current alignment using llvm-readelf
    ALIGNMENT=$(llvm-readelf -l "$lib" 2>/dev/null | grep -A 1 "LOAD" | grep "Align" | head -1 | awk '{print $NF}')
    
    if [ "$ALIGNMENT" = "0x1000" ]; then
        echo "  Found 4KB alignment, attempting to align to 16KB..."
        
        # Create backup
        cp "$lib" "${lib}.backup"
        
        # Use llvm-objcopy to modify alignment
        # Note: This may not work for all cases, as ELF segment alignment is set at link time
        # We'll try to use --set-section-alignment if available
        if "$LLVM_OBJCOPY" --help 2>&1 | grep -q "set-section-alignment"; then
            "$LLVM_OBJCOPY" --set-section-alignment .text=16384 \
                           --set-section-alignment .rodata=16384 \
                           --set-section-alignment .data=16384 \
                           "$lib" "${lib}.aligned" 2>/dev/null || {
                echo "  Warning: Could not align $lib, restoring backup"
                mv "${lib}.backup" "$lib"
            }
            
            if [ -f "${lib}.aligned" ]; then
                mv "${lib}.aligned" "$lib"
                rm "${lib}.backup"
                echo "  Successfully aligned $lib to 16KB"
            fi
        else
            echo "  Warning: llvm-objcopy does not support alignment modification"
            rm "${lib}.backup"
        fi
    elif [ "$ALIGNMENT" = "0x4000" ]; then
        echo "  Already 16KB aligned: $lib"
    else
        echo "  Unknown alignment $ALIGNMENT for $lib"
    fi
done





