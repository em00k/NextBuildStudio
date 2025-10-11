	org 32768
.core.__START_PROGRAM:
	push iy
	ld iy, 0x5C3A  ; ZX Spectrum ROM variables address
	ld (.core.__CALL_BACK__), sp
	call .core.__MEM_INIT
	jp .core.__MAIN_PROGRAM__
.core.__CALL_BACK__:
	DEFW 0
.core.ZXBASIC_USER_DATA:
	; Defines HEAP SIZE
.core.ZXBASIC_HEAP_SIZE EQU 1024
.core.ZXBASIC_MEM_HEAP:
	DEFS 1024
	; Defines USER DATA Length in bytes
.core.ZXBASIC_USER_DATA_LEN EQU .core.ZXBASIC_USER_DATA_END - .core.ZXBASIC_USER_DATA
	.core.__LABEL__.ZXBASIC_USER_DATA_LEN EQU .core.ZXBASIC_USER_DATA_LEN
	.core.__LABEL__.ZXBASIC_USER_DATA EQU .core.ZXBASIC_USER_DATA
_k:
	DEFB 00, 00
_kdown:
	DEFB 00
_n:
	DEFB 00
.core.ZXBASIC_USER_DATA_END:
.core.__MAIN_PROGRAM__:
#line 18 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		BIT_UP          equ 4
		BIT_DOWN        equ 5
		BIT_LEFT        equ 6
		BIT_RIGHT       equ 7

		DIR_NONE        equ %00000000
		DIR_UP          equ %00010000
		DIR_DOWN        equ %00100000
		DIR_LEFT        equ %01000000
		DIR_RIGHT       equ %10000000

		DIR_UP_I        equ %11101111
		DIR_DOWN_I      equ %11011111
		DIR_LEFT_I      equ %10111111
		DIR_RIGHT_I     equ %01111111




		ULA_P_FE                        equ $FE
		TIMEX_P_FF                      equ $FF

		ZX128_MEMORY_P_7FFD             equ $7FFD
		ZX128_MEMORY_P_DFFD             equ $DFFD
		ZX128P3_MEMORY_P_1FFD           equ $1FFD

		AY_REG_P_FFFD                   equ $FFFD
		AY_DATA_P_BFFD                  equ $BFFD

		Z80_DMA_PORT_DATAGEAR           equ $6B
		Z80_DMA_PORT_MB02               equ $0B

		DIVMMC_CONTROL_P_E3             equ $E3
		SPI_CS_P_E7                     equ $E7
		SPI_DATA_P_EB                   equ $EB

		KEMPSTON_MOUSE_X_P_FBDF         equ $FBDF
		KEMPSTON_MOUSE_Y_P_FFDF         equ $FFDF
		KEMPSTON_MOUSE_B_P_FADF         equ $FADF

		KEMPSTON_JOY1_P_1F              equ $1F
		KEMPSTON_JOY2_P_37              equ $37




		TBBLUE_REGISTER_SELECT_P_243B   equ $243B



		TBBLUE_REGISTER_ACCESS_P_253B   equ $253B




		DAC_GS_COVOX_INDEX              equ     1
		DAC_PENTAGON_ATM_INDEX          equ     2
		DAC_SPECDRUM_INDEX              equ     3
		DAC_SOUNDRIVE1_INDEX            equ     4
		DAC_SOUNDRIVE2_INDEX            equ     5
		DAC_COVOX_INDEX                 equ     6
		DAC_PROFI_COVOX_INDEX           equ     7







		I2C_SCL_P_103B                  equ $103B
		I2C_SDA_P_113B                  equ $113B
		UART_TX_P_133B                  equ $133B
		UART_RX_P_143B                  equ $143B
		UART_CTRL_P_153B                equ $153B

		ZILOG_DMA_P_0B                  equ $0B
		ZXN_DMA_P_6B                    equ $6B






		LAYER2_ACCESS_P_123B            equ $123B



		LAYER2_ACCESS_WRITE_OVER_ROM    equ $01
		LAYER2_ACCESS_L2_ENABLED        equ $02
		LAYER2_ACCESS_READ_OVER_ROM     equ $04
		LAYER2_ACCESS_SHADOW_OVER_ROM   equ $08
		LAYER2_ACCESS_BANK_OFFSET       equ $10
		LAYER2_ACCESS_OVER_ROM_BANK_M   equ $C0
		LAYER2_ACCESS_OVER_ROM_BANK_0   equ $00
		LAYER2_ACCESS_OVER_ROM_BANK_1   equ $40
		LAYER2_ACCESS_OVER_ROM_BANK_2   equ $80
		LAYER2_ACCESS_OVER_ROM_48K      equ $C0

		SPRITE_STATUS_SLOT_SELECT_P_303B    equ $303B





















		SPRITE_STATUS_MAXIMUM_SPRITES   equ $02
		SPRITE_STATUS_COLLISION         equ $01
		SPRITE_SLOT_SELECT_PATTERN_HALF equ 128

		SPRITE_ATTRIBUTE_P_57           equ $57





		SPRITE_PATTERN_P_5B             equ $5B








		TURBO_SOUND_CONTROL_P_FFFD      equ $FFFD



		MACHINE_ID_NR_00                equ $00
		NEXT_VERSION_NR_01              equ $01
		NEXT_RESET_NR_02                equ $02
		MACHINE_TYPE_NR_03              equ $03
		ROM_MAPPING_NR_04               equ $04
		PERIPHERAL_1_NR_05              equ $05
		PERIPHERAL_2_NR_06              equ $06
		TURBO_CONTROL_NR_07             equ $07
		PERIPHERAL_3_NR_08              equ $08
		PERIPHERAL_4_NR_09              equ $09
		PERIPHERAL_5_NR_0A              equ $0A
		NEXT_VERSION_MINOR_NR_0E        equ $0E
		ANTI_BRICK_NR_10                equ $10
		VIDEO_TIMING_NR_11              equ $11
		LAYER2_RAM_BANK_NR_12           equ $12
		LAYER2_RAM_SHADOW_BANK_NR_13    equ $13
		GLOBAL_TRANSPARENCY_NR_14       equ $14
		SPRITE_CONTROL_NR_15            equ $15





		LAYER2_XOFFSET_NR_16            equ $16
		LAYER2_YOFFSET_NR_17            equ $17
		CLIP_LAYER2_NR_18               equ $18
		CLIP_SPRITE_NR_19               equ $19
		CLIP_ULA_LORES_NR_1A            equ $1A
		CLIP_TILEMAP_NR_1B              equ $1B
		CLIP_WINDOW_CONTROL_NR_1C       equ $1C
		VIDEO_LINE_MSB_NR_1E            equ $1E
		VIDEO_LINE_LSB_NR_1F            equ $1F
		VIDEO_INTERUPT_CONTROL_NR_22    equ $22
		VIDEO_INTERUPT_VALUE_NR_23      equ $23
		ULA_XOFFSET_NR_26               equ $26
		ULA_YOFFSET_NR_27               equ $27
		HIGH_ADRESS_KEYMAP_NR_28        equ $28
		LOW_ADRESS_KEYMAP_NR_29         equ $29
		HIGH_DATA_TO_KEYMAP_NR_2A       equ $2A
		LOW_DATA_TO_KEYMAP_NR_2B        equ $2B
		DAC_B_MIRROR_NR_2C              equ $2C
		DAC_AD_MIRROR_NR_2D             equ $2D
		SOUNDDRIVE_DF_MIRROR_NR_2D      equ $2D
		DAC_C_MIRROR_NR_2E              equ $2E
		TILEMAP_XOFFSET_MSB_NR_2F       equ $2F
		TILEMAP_XOFFSET_LSB_NR_30       equ $30
		TILEMAP_YOFFSET_NR_31           equ $31
		LORES_XOFFSET_NR_32             equ $32
		LORES_YOFFSET_NR_33             equ $33
		SPRITE_ATTR_SLOT_SEL_NR_34      equ $34
		SPRITE_ATTR0_NR_35              equ $35
		SPRITE_ATTR1_NR_36              equ $36
		SPRITE_ATTR2_NR_37              equ $37
		SPRITE_ATTR3_NR_38              equ $38
		SPRITE_ATTR4_NR_39              equ $39
		PALETTE_INDEX_NR_40             equ $40
		PALETTE_VALUE_NR_41             equ $41
		PALETTE_FORMAT_NR_42            equ $42
		PALETTE_CONTROL_NR_43           equ $43
		PALETTE_VALUE_9BIT_NR_44        equ $44
		TRANSPARENCY_FALLBACK_COL_NR_4A equ $4A
		SPRITE_TRANSPARENCY_I_NR_4B     equ $4B
		TILEMAP_TRANSPARENCY_I_NR_4C    equ $4C
		MMU0_0000_NR_50                 equ $50
		MMU1_2000_NR_51                 equ $51
		MMU2_4000_NR_52                 equ $52
		MMU3_6000_NR_53                 equ $53
		MMU4_8000_NR_54                 equ $54
		MMU5_A000_NR_55                 equ $55
		MMU6_C000_NR_56                 equ $56
		MMU7_E000_NR_57                 equ $57
		COPPER_DATA_NR_60               equ $60
		COPPER_CONTROL_LO_NR_61         equ $61
		COPPER_CONTROL_HI_NR_62         equ $62
		COPPER_DATA_16B_NR_63           equ $63
		VIDEO_LINE_OFFSET_NR_64         equ $64
		ULA_CONTROL_NR_68               equ $68
		DISPLAY_CONTROL_NR_69           equ $69
		LORES_CONTROL_NR_6A             equ $6A
		TILEMAP_CONTROL_NR_6B           equ $6B
		TILEMAP_DEFAULT_ATTR_NR_6C      equ $6C
		TILEMAP_BASE_ADR_NR_6E          equ $6E
		TILEMAP_GFX_ADR_NR_6F           equ $6F
		LAYER2_CONTROL_NR_70            equ $70
		LAYER2_XOFFSET_MSB_NR_71        equ $71
		SPRITE_ATTR0_INC_NR_75          equ $75
		SPRITE_ATTR1_INC_NR_76          equ $76
		SPRITE_ATTR2_INC_NR_77          equ $77
		SPRITE_ATTR3_INC_NR_78          equ $78
		SPRITE_ATTR4_INC_NR_79          equ $79
		USER_STORAGE_0_NR_7F            equ $7F
		EXPANSION_BUS_ENABLE_NR_80      equ $80
		EXPANSION_BUS_CONTROL_NR_81     equ $81
		INTERNAL_PORT_DECODING_0_NR_82  equ $82
		INTERNAL_PORT_DECODING_1_NR_83  equ $83
		INTERNAL_PORT_DECODING_2_NR_84  equ $84
		INTERNAL_PORT_DECODING_3_NR_85  equ $85
		EXPANSION_BUS_DECODING_0_NR_86  equ $86
		EXPANSION_BUS_DECODING_1_NR_87  equ $87
		EXPANSION_BUS_DECODING_2_NR_88  equ $88
		EXPANSION_BUS_DECODING_3_NR_89  equ $89
		EXPANSION_BUS_PROPAGATE_NR_8A   equ $8A
		ALTERNATE_ROM_NR_8C             equ $8C
		ZX_MEM_MAPPING_NR_8E            equ $8E
		PI_GPIO_OUT_ENABLE_0_NR_90      equ $90
		PI_GPIO_OUT_ENABLE_1_NR_91      equ $91
		PI_GPIO_OUT_ENABLE_2_NR_92      equ $92
		PI_GPIO_OUT_ENABLE_3_NR_93      equ $93
		PI_GPIO_0_NR_98                 equ $98
		PI_GPIO_1_NR_99                 equ $99
		PI_GPIO_2_NR_9A                 equ $9A
		PI_GPIO_3_NR_9B                 equ $9B
		PI_PERIPHERALS_ENABLE_NR_A0     equ $A0
		PI_I2S_AUDIO_CONTROL_NR_A2      equ $A2

		ESP_WIFI_GPIO_OUTPUT_NR_A8      equ $A8
		ESP_WIFI_GPIO_NR_A9             equ $A9
		EXTENDED_KEYS_0_NR_B0           equ $B0
		EXTENDED_KEYS_1_NR_B1           equ $B1


		DEBUG_LED_CONTROL_NR_FF         equ $FF



		MEM_ROM_CHARS_3C00              equ $3C00
		MEM_ZX_SCREEN_4000              equ $4000
		MEM_ZX_ATTRIB_5800              equ $5800
		MEM_LORES0_4000                 equ $4000
		MEM_LORES1_6000                 equ $6000
		MEM_TIMEX_SCR0_4000             equ $4000
		MEM_TIMEX_SCR1_6000             equ $6000



		COPPER_NOOP                     equ %00000000
		COPPER_WAIT_H                   equ %10000000
		COPPER_HALT_B                   equ $FF



		DMA_RESET                   equ $C3
		DMA_RESET_PORT_A_TIMING     equ $C7
		DMA_RESET_PORT_B_TIMING     equ $CB
		DMA_LOAD                    equ $CF
		DMA_CONTINUE                equ $D3
		DMA_DISABLE_INTERUPTS       equ $AF
		DMA_ENABLE_INTERUPTS        equ $AB
		DMA_RESET_DISABLE_INTERUPTS equ $A3
		DMA_ENABLE_AFTER_RETI       equ $B7
		DMA_READ_STATUS_BYTE        equ $BF
		DMA_REINIT_STATUS_BYTE      equ $8B
		DMA_START_READ_SEQUENCE     equ $A7
		DMA_FORCE_READY             equ $B3
		DMA_DISABLE                 equ $83
		DMA_ENABLE                  equ $87
		DMA_READ_MASK_FOLLOWS       equ $BB
		DMA_WRITE_REGISTER_COMMAND     equ $bb
		DMA_BURST                      equ %11001101
		DMA_CONTINUOUS                 equ %10101101




		ULA_PALETTE_P1  equ %000<<4
		ULA_PALETTE_P2  equ %100<<4
		L2_PALETTE_P1   equ %001<<4
		L2_PALETTE_P2   equ %101<<4
		SPR_PALETTE_P1  equ %010<<4
		SPR_PALETTE_P2  equ %110<<4
		TILE_PALETTE_P1 equ %011<<4
		TILE_PALETTE_P2 equ %111<<4




		M_GETSETDRV         equ $89
		F_OPEN              equ $9a
		F_CLOSE             equ $9b
		F_READ              equ $9d
		F_WRITE             equ $9e
		F_SEEK              equ $9f
		F_STAT              equ $a1
		F_SIZE              equ $ac
		FA_READ             equ $01
		FA_APPEND           equ $06
		FA_OVERWRITE        equ $0C
		LAYER2_ACCESS_PORT  EQU $123B


		di


#line 355 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
	xor a
	call .core.BORDER
	xor a
	call .core.PAPER
	ld a, 7
	call .core.INK
	call .core.CLS
#line 248 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"



#line 264 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"

		jp  __NEW_PLOT_END_




__NEW_PLOT_END_:

#line 260 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"
#line 276 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"

_nb_layer2_enabled_:
		db      0

#line 280 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"
#line 280 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"

_screen_mode:
		db      0

#line 284 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"
#line 4047 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"




		ld iy,$5c3a



		jp endfilename


#line 4058 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
	call _check_interrupts
.LABEL._filename:
#line 4066 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

filename:
		DEFS 320,0
endfilename:

#line 4071 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
.LABEL._INTERNAL_STACK_TOP:
#line 4074 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

nbtempstackstart:
		ld sp,nbtempstackstart-2


#line 4079 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 4081 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"





		jp nextbuild_file_end



shadowlayerbit:
		db 0

#line 4093 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 4094 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"


#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/zxnext_utils.asm"

		push namespace core

		PROC
__zxnbackup_sysvar_bank:
		push    af
		push    bc
		ld	bc,$243B
		ld	a, $52
		out 	(c), a
		inc 	b
		in	a, (c)
		ld 	(__zxnbackup_sysvar_bank_restore+3),a
		pop     bc
		pop     af
		nextreg     $52, $0a
		nextreg     $50, $ff
		nextreg     $51, $ff
		ret

__zxnbackup_sysvar_bank_restore:
		nextreg $52, $0a
		ret
		ENDP

		pop namespace
#line 4097 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"


#line 4126 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 4344 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

nextbuild_file_end:


#line 4348 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 14 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"





		afxChDesc       	EQU     $fd02
		sfxenablednl    	EQU     $fd40
		currentmusicbanknl	EQU 	$fd44
		currentsfxbank		EQU 	$fd48
		bankbuffersplayernl EQU     $fd50
		sampletoplay		EQU 	$fd58
		ayfxbankinplaycode	EQU 	$fd3e
		second_mod_address	EQU 	$fd60

#line 28 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
	xor a
	call _InitLayer2
	ld hl, 3814
	push hl
	ld a, 25
	push af
	ld a, 37
	push af
	ld a, 38
	push af
	call _InitInterrupts
	xor a
	push af
	ld a, 40
	push af
	ld hl, .LABEL.__LABEL0
	call .core.__LOADSTR
	push hl
	xor a
	push af
	xor a
	push af
	call _L2Text
	xor a
	push af
	ld a, 40
	push af
	ld hl, .LABEL.__LABEL1
	call .core.__LOADSTR
	push hl
	ld a, 1
	push af
	xor a
	push af
	call _L2Text
	xor a
	push af
	ld a, 40
	push af
	ld hl, .LABEL.__LABEL2
	call .core.__LOADSTR
	push hl
	ld a, 3
	push af
	xor a
	push af
	call _L2Text
	ld hl, .LABEL.__LABEL3
	call .core.__LOADSTR
	push hl
	call _Console
.LABEL.__LABEL4:
	call .core.INKEY
	ex de, hl
	ld hl, _k
	call .core.__STORE_STR2
	ld a, (_kdown)
	dec a
	jp nz, .LABEL.__LABEL6
	ld de, .LABEL.__LABEL8
	ld hl, (_k)
	xor a
	call .core.__STREQ
	or a
	jp z, .LABEL.__LABEL10
	xor a
	ld (_kdown), a
.LABEL.__LABEL10:
	jp .LABEL.__LABEL7
.LABEL.__LABEL6:
	ld de, .LABEL.__LABEL11
	ld hl, (_k)
	xor a
	call .core.__STREQ
	or a
	jp z, .LABEL.__LABEL12
	ld hl, 3025
	push hl
	ld a, 28
	call _NewMusic
	ld a, 1
	ld (_kdown), a
	ld hl, .LABEL.__LABEL14
	call .core.__LOADSTR
	push hl
	call _Console
	jp .LABEL.__LABEL7
.LABEL.__LABEL12:
	ld de, .LABEL.__LABEL15
	ld hl, (_k)
	xor a
	call .core.__STREQ
	or a
	jp z, .LABEL.__LABEL16
	ld hl, 3814
	push hl
	ld a, 25
	call _NewMusic
	ld a, 1
	ld (_kdown), a
	ld hl, .LABEL.__LABEL18
	call .core.__LOADSTR
	push hl
	call _Console
	jp .LABEL.__LABEL7
.LABEL.__LABEL16:
	ld de, .LABEL.__LABEL19
	ld hl, (_k)
	xor a
	call .core.__STREQ
	or a
	jp z, .LABEL.__LABEL7
	ld a, 255
	push af
	ld a, 40
	push af
	ld a, (_n)
	call .core.__U8TOFREG
	call .core.__STR_FAST
	ex de, hl
	ld hl, .LABEL.__LABEL22
	push de
	call .core.__ADDSTR
	ex (sp), hl
	call .core.__MEM_FREE
	pop hl
	ld de, .LABEL.__LABEL23
	push hl
	call .core.__ADDSTR
	ex (sp), hl
	call .core.__MEM_FREE
	pop hl
	push hl
	ld a, 5
	push af
	xor a
	push af
	call _L2Text
	ld a, (_n)
	call _PlaySFX
	ld a, (_n)
	inc a
	and 63
	ld (_n), a
	ld a, 1
	ld (_kdown), a
	ld a, (_n)
	call .core.__U8TOFREG
	call .core.__STR_FAST
	ex de, hl
	ld hl, .LABEL.__LABEL24
	push de
	call .core.__ADDSTR
	ex (sp), hl
	call .core.__MEM_FREE
	pop hl
	push hl
	call _Console
.LABEL.__LABEL7:
	jp .LABEL.__LABEL4
.core.__END_PROGRAM:
	di
	ld hl, (.core.__CALL_BACK__)
	ld sp, hl
	pop iy
	ret
_check_interrupts:
#line 763 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"


		PROC
		LOCAL start, interrutps_disabled
start:


		ex      af,af'
		ld      a,i
		ld      a,r
		jp      po,interrutps_disabled
		ld      a,1
		ld      (.interrupt_enabled_flag),a
		ex      af,af'
		ret
interrutps_disabled:
		xor     a
		ld      (.interrupt_enabled_flag),a
		ex      af,af'
		ret
		ENDP
#line 785 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
		ret

	.interrupt_enabled_flag:
		db 1


#line 791 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_check_interrupts__leave:
	ret
_L2Text:
	push ix
	ld ix, 0
	add ix, sp
#line 2721 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		PROC

		LOCAL plotTilesLoop2, printloop, inloop, addspace, addspace2



#line 2732 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		db $3e,$52,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 2733
		ld (textfontdone+1),a

	ld e,(IX+5) : ld d,(IX+7)
	ld l,(IX+8) : ld h,(IX+9)
	ld a,(hl) : ld b,a
	inc hl : inc hl
	ld a,(IX+11) : nextreg $52,a

printloop:
		push bc
		ld a,(hl)
	cp 32 : jp z,addspace


		sub 32
#line 2751 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
inloop:
	push hl : push de
		ex de,hl
		call PlotTextTile
	pop de : pop hl
		inc hl
		inc e
		pop bc
		djnz printloop
		jp textfontdone
addspace:
		inc hl
		inc e
		pop bc
		djnz printloop
addspace2:
		ld a,0
		jp textfontdone

PlotTextTile:


	ld d,64 : ld e,a

		DB $ED,$30

#line 2775
	ld a,$40  : or d
	ex de,hl     : ld h,a : ld a,e
	rlca : rlca : rlca
	ld e,a : ld a,d
	rlca : rlca : rlca
	ld d,a : and 192 : or 3
		ld bc,LAYER2_ACCESS_PORT
	out (c),a : ld a,d : and 63
	ld d,a : ld bc,$800
		push de
		ld a,(IX+13)

plotTilesLoop2:

		push bc
		ld bc,8
		push de
		ldirx
		pop de
		inc d
		pop bc
		djnz plotTilesLoop2






		pop de
		ret
textfontdone:
	ld a,$0a : nextreg $52,a
endofl2text:
	ld a,2 : ld bc,LAYER2_ACCESS_PORT
		out (c),a
#line 2814 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
		ENDP


#line 2814 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_L2Text__leave:
	ex af, af'
	exx
	ld l, (ix+8)
	ld h, (ix+9)
	call .core.__MEM_FREE
	ex af, af'
	exx
	ld sp, ix
	pop ix
	exx
	pop hl
	pop bc
	pop bc
	pop bc
	pop bc
	ex (sp), hl
	exx
	ret
_Console:
	push ix
	ld ix, 0
	add ix, sp
	ld l, (ix+4)
	ld h, (ix+5)
	ld de, .LABEL.__LABEL25
	call .core.__ADDSTR
	ld d, h
	ld e, l
	ld bc, 4
	call .core.__PSTORE_STR2
#line 3850 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		ld      h, (ix+5)
		ld      l, (ix+4)
		add     hl, 2
		rst     $18


#line 3857 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_Console__leave:
	ex af, af'
	exx
	ld l, (ix+4)
	ld h, (ix+5)
	call .core.__MEM_FREE
	ex af, af'
	exx
	ld sp, ix
	pop ix
	exx
	pop hl
	ex (sp), hl
	exx
	ret
_InitLayer2:
#line 35 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"

		PROC
		LOCAL mode0, mode1, mode2


		nextreg DISPLAY_CONTROL_NR_69,  %00000000

		nextreg SPRITE_CONTROL_NR_15,   %000_001_00
		nextreg GLOBAL_TRANSPARENCY_NR_14,0
		nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0
		nextreg PALETTE_CONTROL_NR_43,  %00000001
		nextreg PALETTE_VALUE_NR_41,    0
		nextreg TURBO_CONTROL_NR_07,    3

		nextreg CLIP_LAYER2_NR_18,      %00000000
		nextreg CLIP_LAYER2_NR_18,      %11111111
		nextreg CLIP_LAYER2_NR_18,      %00000000
		nextreg CLIP_LAYER2_NR_18,      %11111111


		ld      c, a
		and     %11
		swapnib

		nextreg LAYER2_CONTROL_NR_70,a

		ld      a, c
		ld      (._screen_mode),a
		ld      c,0

_pick_screenmode:

		and     %11
		or      a
		jr      z,mode0
		dec     a
		jr      z,mode1
		dec     a
		jr      z,mode2
		ret

mode0:

		ld      b, 6
		jr      mode_common
mode1:

		ld      b, 10
		jr      mode_common
mode2:

		ld      b, 10

		ld      a, c
		swapnib
		or      c
		ld      c, a

mode_common:
		push    bc

		db $3e,$12,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 96
		add     a, a

		jp      .__clear_banks

		ENDP

#line 104 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"
	call __clear_banks
_InitLayer2__leave:
	ret
__clear_banks:
#line 152 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"





#line 161 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"

		nextreg $50, a
		inc     a
		pop     bc
	.bank:
		push    bc
		ld      hl, 0
		ld      de, 1
		ld      (hl), c
		ld      bc, 8191
		ldir

		nextreg $50, a
		inc     a

		pop     bc
		djnz    .bank

		nextreg $50,$ff

#line 184 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"
		ret


#line 182 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"
__clear_banks__leave:
	ret
_NewMusic:
#line 44 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"

		di
		ld 		(bankbuffersplayernl+1),a
		inc 	a
		ld 		(bankbuffersplayernl+2),a
		ld 		a,3
		ld 		(sfxenablednl+1),a
		ld 		de, $fd60
		ex		de, hl
		ld 		(hl), e
		inc 	hl
		ld 		(hl), d
		ei

#line 58 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
_NewMusic__leave:
	ret
_PlaySFX:
#line 66 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"

		ld (sampletoplay),a

#line 69 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
_PlaySFX__leave:
	ret
_InitMusic:
#line 75 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"



		exx
		pop     hl
		exx

		di

		ld      (aybank1+1),a
		pop     af
		ld      (ayseta+1),a
		pop     de
		ld 		hl, $fd60
		ld 		(hl), e
		inc 	hl
		ld 		(hl), d


		db $3e,$52,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 94
		ld 		(exitplayerinit+3),a
		ld 		(exitplayernl+3),a

		db $3e,$50,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 97
		ld		(exitplayerinit+7),a
		ld		(exitplayernl+7),a

		db $3e,$51,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 100
		ld 		(exitplayerinit+11),a
		ld 		(exitplayernl+11),a

aybank1:
		ld      a,0
		nextreg $52,a
		ld      (bankbuffersplayernl),a
ayseta:
		ld      a, 0
		ld      (bankbuffersplayernl+1),a
		nextreg $50,a
		inc     a
		nextreg $51,a
aysetde:
		ld 		hl, $fd60
		ld 		e, (hl)
		inc 	hl
		ld 		d, (hl)
		ld 		a, d
		or 		e
		jr 		z, aysetde2
		ld      a, %0001_0000
		jr 		aysetde1
aysetde2:
		ld      a, %0000_0000
aysetde1:
		ld 		($4000+10), a
		ld      hl,0
		push    ix
		call    $4003
		pop     ix

exitplayerinit:
		nextreg $52,$0a
		nextreg $50,$00
		nextreg $51,$01

ayrepairestack:



	exx : push hl : exx



		ret

ayplayerstack:
		ds      128,0

playmusicnl:



		db $3e,$52,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 154
		ld      (exitplayernl+3),a

	db $3e,$50,$01,$3b,$24,$ed,$79,$04,$ed,$78 : ld (exitplayernl+7),a
#line 156

	db $3e,$51,$01,$3b,$24,$ed,$79,$04,$ed,$78 : ld (exitplayernl+11),a
#line 157

		ld      hl,bankbuffersplayernl
		ld      a,(hl)
		nextreg $52,a
		inc     hl
		ld      a,(hl)
		nextreg $50,a
		inc     a
		nextreg $51,a

		ld      a,(sfxenablednl+1)
		cp      2
		jr      z,mustplayernl

		ld      a,(sfxenablednl+1)
		cp      3
		jr      z,re_init_music


		push    ix
		call    $4005
		pop		ix


exitplayernl:
		nextreg $52,$0a
		nextreg $50,$00
		nextreg $51,$01

ayrepairestack2:

		ret

re_init_music:
		ld 		hl, $fd60
		ld 		e, (hl)
		inc 	hl
		ld 		d, (hl)
		ld 		a, d
		or 		e
		jr 		z, re_init_music2
		ld      a, %0001_0000
		jr 		re_init_music1
re_init_music2:
		ld      a, %0000_0000
re_init_music1:
		ld 		($4000+10), a
		ld      hl,0

		ld		a, 1
		ld      (sfxenablednl+1),a
		push 	hl
		push 	de
		call 	$4008
		pop 	de
		pop 	hl
		call	$4003
		jp      exitplayernl

mustplayernl:
		xor     a
		ld      (sfxenablednl+1),a
		call    $4008
		jp      exitplayernl


#line 235 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
_InitMusic__leave:
	ret
_SetUpIM:
#line 233 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"


	exx : pop hl : exx

		di

		ld      hl,IM_vector
		ld      de,IM_vector+1
		ld      bc,257
		ld      a,h
		ld      i,a
		ld      (hl),a
		ldir

		ld      h,a
		ld      l, a
		ld      a,$c3
		ld      (hl),a
		inc     hl
		ld      de,._ISR
		ld      (hl),e
		inc     hl
		ld      (hl),d

		nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000110
		nextreg VIDEO_INTERUPT_VALUE_NR_23,192

		im      2
		jp      _exit_im_setup
		ALIGN 256
IM_vector:
		defs 257,0
		db      0
_exit_im_setup:
		exx
		push    hl
		exx
		ei


#line 273 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
	call _ISR
_SetUpIM__leave:
	ret
_ISR:
#line 292 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"




		ld 		(out_isr_sp+1), sp
		ld 		sp, temp_isr_sp
	push af : push bc : push hl : push de : push ix : push iy
		ex af,af'
		push af

	exx : push bc : push hl : push de :	exx
		ld 		bc,TBBLUE_REGISTER_SELECT_P_243B
		in 		a,(c)


		ld 		(skipmusicplayer+1), a

		db $3e,$52,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 309
		ld 		(exitplayernl+3),a

		db $3e,$50,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 311
		ld		(exitplayernl+7),a

		db $3e,$51,$01,$3b,$24,$ed,$79,$04,$ed,$78
#line 313
		ld 		(exitplayernl+11),a
#line 315 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"


#line 323 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
#line 328 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"



		ld 		a,(sampletoplay)
		cp		$ff
		jr 		z,no_sfx_to_play

		call 	PlaySFX

no_sfx_to_play:

		ld      a,(sfxenablednl)
	or      a : jr z,skipfxplayernl

		call    _CallbackSFX

skipfxplayernl:
		ld      a,(sfxenablednl+1)
	or      a : jr z,skipmusicplayer
	ld 		bc,65533	: ld a,255:out (c),a
		call    playmusicnl


#line 351 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
#line 353 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"


skipmusicplayer:
		ld 		a,0
		ld		bc, TBBLUE_REGISTER_SELECT_P_243B
		out 	(c), a



		exx
	pop de : pop hl : pop bc
		exx

	pop af : ex af,af'
	pop iy : pop ix : pop de : pop hl : pop bc : pop af
out_isr_sp:
		ld 		sp, 0000
		ei
		ret

#line 373 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
#line 373 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"

		ds 128, 0
temp_isr_sp:
		db 0, 0

#line 378 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
_ISR__leave:
	ret
_PlaySFXSys:
#line 383 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"






PlaySFX:
		PROC
		Local ayfxrestoreslot

		push 	ix

		ld 		a,(sampletoplay)

		ld 		d,a

		ld 		a,$ff
		ld 		(sampletoplay),a


	db $3e,$51,$01,$3b,$24,$ed,$79,$04,$ed,$78 : ld (ayfxrestoreslot+3),a
#line 403

	db $3e,$52,$01,$3b,$24,$ed,$79,$04,$ed,$78 : ld (ayfxrestoreslot+7),a
#line 404

		ld 		a,(ayfxbankinplaycode)
		nextreg $51,a
		inc 	a
		nextreg $52,a

		ld 		a,d

AFXPLAY:

		ld 		de,0
		ld 		h,e
		ld 		l,a
		add 	hl,hl

afxBnkAdr:

		ld 		bc,0
		add 	hl,bc
		ld 		c,(hl)
		inc 	hl
		ld 		b,(hl)
		add 	hl,bc
		push 	hl

		ld 		hl,afxChDesc
		ld 		b,3

afxPlay0:

		inc 	hl
		inc 	hl
		ld 		a,(hl)
		inc 	hl
		cp 		e
		jr 		c,afxPlay1
		ld 		c,a
		ld 		a,(hl)
		cp 		d
		jr 		c,afxPlay1
		ld 		e,c
		ld 		d,a
		push 	hl
		pop 	ix

afxPlay1:

		inc 	hl
		djnz 	afxPlay0

		pop 	de
		ld 		(ix-3),e
		ld 		(ix-2),d
		ld 		(ix-1),b
		ld 		(ix-0),b

ayfxrestoreslot:

		nextreg $51,$ff
		nextreg $52,$ff
		pop 	ix


		ENDP


#line 474 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
_PlaySFXSys__leave:
	ret
_InitSFX:
#line 476 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"









		PROC
		LOCAL ayfxrestoreslot

		ld 		d,a
		call 	_check_interrupts
		di

		exx
		pop 	hl
		exx


	db $3e,$51,$01,$3b,$24,$ed,$79,$04,$ed,$78 : ld (ayfxrestoreslot+3),a
#line 497

	db $3e,$52,$01,$3b,$24,$ed,$79,$04,$ed,$78 : ld (ayfxrestoreslot+7),a
#line 498

		ld 		a,d
		ld 		(ayfxbankinplaycode),a
		nextreg $51,a
		inc 	a
		nextreg $52,a

		ld 		hl,$2000

AFXINIT:
		inc 	hl
		ld 		(afxBnkAdr+1),hl

		ld 		hl,afxChDesc
		ld 		de,$00ff
		ld 		bc,$03fd

afxInit0:
		ld 		(hl),d
		inc 	hl
		ld 		(hl),d
		inc 	hl
		ld 		(hl),e
		inc 	hl
		ld 		(hl),e
		inc 	hl
		djnz 	afxInit0

		ld 		hl,$ffbf
		ld 		e,$15

afxInit1:
		dec 	e
		ld 		b,h
		out 	(c),e
		ld 		b,l
		out 	(c),d
		jr 		nz,afxInit1
		ld 		(afxNseMix+1),de

ayfxrestoreslot:

		nextreg $51,$0
		nextreg $52,$1

		exx
		push 	hl
		exx

		ret

		ENDP


#line 556 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
	call _CallbackSFX
	call _PlaySFXSys
_InitSFX__leave:
	ret
_CallbackSFX:
#line 563 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"


		PROC

		LOCAL ayfxrestoreslot

AFXFRAME:





		exx
		push ix



	db $3e,$51,$01,$3b,$24,$ed,$79,$04,$ed,$78 : ld (ayfxrestoreslot+3),a
#line 580

	db $3e,$52,$01,$3b,$24,$ed,$79,$04,$ed,$78 : ld (ayfxrestoreslot+7),a
#line 581

		ld 		a,(ayfxbankinplaycode)
		nextreg $51,a
		inc 	a
		nextreg $52,a

	ld bc,65533	: ld a,253:out (c),a

		ld 		bc,$03fd
		ld 		ix,afxChDesc

afxFrame0:
		push 	bc

		ld 		a,11
		ld 		h,(ix+1)
		cp 		h
		jr 		nc,afxFrame7
		ld 		l,(ix+0)

		ld 		e,(hl)
		inc 	hl

		sub 	b
		ld 		d,b

		ld 		b,$ff
		out 	(c),a
		ld 		b,$bf
		ld 		a,e
		and 	$0f
		out 	(c),a

		bit 	5,e
		jr 		z,afxFrame1

		ld 		a,3
		sub 	d
		add 	a,a

		ld 		b,$ff
		out 	(c),a
		ld 		b,$bf
		ld 		d,(hl)
		inc 	hl
		out 	(c),d
		ld 		b,$ff
		inc 	a
		out 	(c),a
		ld 		b,$bf
		ld 		d,(hl)
		inc 	hl
		out 	(c),d

afxFrame1:

		bit 	6,e
		jr 		z,afxFrame3

		ld 		a,(hl)
		sub 	$20
		jr 		c,afxFrame2
		ld 		h,a
		ld 		b,$ff
		ld 		b,c
		jr 		afxFrame6

afxFrame2:
		inc 	hl
		ld 		(afxNseMix+1),a

afxFrame3:
		pop 	bc
		push 	bc
		inc 	b

		ld 		a,%01101111
afxFrame4:
		rrc 	e
		rrca
		djnz 	afxFrame4
		ld d	,a

		ld 		bc,afxNseMix+2
		ld 		a,(bc)
		xor 	e
		and 	d
		xor 	e
		ld 		(bc),a

afxFrame5:
		ld 		c,(ix+2)
		ld 		b,(ix+3)
		inc 	bc

afxFrame6:
		ld 		(ix+2),c
		ld 		(ix+3),b

		ld 		(ix+0),l
		ld 		(ix+1),h

afxFrame7:
		ld 		bc,4
		add 	ix,bc
		pop 	bc
		djnz 	afxFrame0

		ld 		hl,$ffbf

afxNseMix:
		ld 		de,0
		ld 		a,6
		ld 		b,h
		out 	(c),a
		ld 		b,l
		out 	(c),e
		inc 	a
		ld 		b,h
		out 	(c),a
		ld 		b,l
		out 	(c),d
		pop 	ix
		exx

ayfxrestoreslot:
		nextreg $51,$0
		nextreg $52,$1


		ld 		bc,65533
		ld 		a,255
		out 	(c),a
		ret

		ENDP


#line 723 "/home/usb/Documents/NextBuildv9/Scripts/nextlib_ints.bas"
_CallbackSFX__leave:
	ret
_InitInterrupts:
	push ix
	ld ix, 0
	add ix, sp
	ld a, (ix+5)
	call _InitSFX
	ld l, (ix+10)
	ld h, (ix+11)
	push hl
	ld a, (ix+9)
	push af
	ld a, (ix+7)
	call _InitMusic
	call _SetUpIM
	ld a, 255
	call _PlaySFX
#line 69 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
	: ld a,1 : ld (sfxenablednl+1),a :
#line 70 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 70 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
	: ld a,1 : ld (sfxenablednl),a :
#line 71 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
_InitInterrupts__leave:
	ld sp, ix
	pop ix
	exx
	pop hl
	pop bc
	pop bc
	pop bc
	ex (sp), hl
	exx
	ret
.LABEL.__LABEL0:
	DEFW 001Ch
	DEFB 54h
	DEFB 55h
	DEFB 52h
	DEFB 42h
	DEFB 4Fh
	DEFB 53h
	DEFB 4Fh
	DEFB 55h
	DEFB 4Eh
	DEFB 44h
	DEFB 20h
	DEFB 49h
	DEFB 4Eh
	DEFB 54h
	DEFB 45h
	DEFB 52h
	DEFB 52h
	DEFB 55h
	DEFB 50h
	DEFB 54h
	DEFB 20h
	DEFB 45h
	DEFB 58h
	DEFB 41h
	DEFB 4Dh
	DEFB 50h
	DEFB 4Ch
	DEFB 45h
.LABEL.__LABEL1:
	DEFW 0018h
	DEFB 4Bh
	DEFB 45h
	DEFB 59h
	DEFB 53h
	DEFB 20h
	DEFB 31h
	DEFB 20h
	DEFB 2Dh
	DEFB 20h
	DEFB 32h
	DEFB 20h
	DEFB 54h
	DEFB 4Fh
	DEFB 20h
	DEFB 53h
	DEFB 57h
	DEFB 41h
	DEFB 50h
	DEFB 20h
	DEFB 54h
	DEFB 55h
	DEFB 4Eh
	DEFB 45h
	DEFB 53h
.LABEL.__LABEL2:
	DEFW 000Fh
	DEFB 33h
	DEFB 20h
	DEFB 54h
	DEFB 4Fh
	DEFB 20h
	DEFB 50h
	DEFB 4Ch
	DEFB 41h
	DEFB 59h
	DEFB 20h
	DEFB 41h
	DEFB 59h
	DEFB 20h
	DEFB 46h
	DEFB 58h
.LABEL.__LABEL3:
	DEFW 000Bh
	DEFB 48h
	DEFB 65h
	DEFB 6Ch
	DEFB 6Ch
	DEFB 6Fh
	DEFB 20h
	DEFB 57h
	DEFB 6Fh
	DEFB 72h
	DEFB 6Ch
	DEFB 64h
.LABEL.__LABEL8:
	DEFW 0000h
.LABEL.__LABEL11:
	DEFW 0001h
	DEFB 31h
.LABEL.__LABEL14:
	DEFW 000Fh
	DEFB 50h
	DEFB 6Ch
	DEFB 61h
	DEFB 79h
	DEFB 69h
	DEFB 6Eh
	DEFB 67h
	DEFB 20h
	DEFB 6Dh
	DEFB 75h
	DEFB 73h
	DEFB 69h
	DEFB 63h
	DEFB 20h
	DEFB 31h
.LABEL.__LABEL15:
	DEFW 0001h
	DEFB 32h
.LABEL.__LABEL18:
	DEFW 000Fh
	DEFB 50h
	DEFB 6Ch
	DEFB 61h
	DEFB 79h
	DEFB 69h
	DEFB 6Eh
	DEFB 67h
	DEFB 20h
	DEFB 6Dh
	DEFB 75h
	DEFB 73h
	DEFB 69h
	DEFB 63h
	DEFB 20h
	DEFB 32h
.LABEL.__LABEL19:
	DEFW 0001h
	DEFB 33h
.LABEL.__LABEL22:
	DEFW 0005h
	DEFB 41h
	DEFB 59h
	DEFB 46h
	DEFB 58h
	DEFB 20h
.LABEL.__LABEL23:
	DEFW 0001h
	DEFB 20h
.LABEL.__LABEL24:
	DEFW 000Ch
	DEFB 50h
	DEFB 6Ch
	DEFB 61h
	DEFB 79h
	DEFB 69h
	DEFB 6Eh
	DEFB 67h
	DEFB 20h
	DEFB 73h
	DEFB 66h
	DEFB 78h
	DEFB 20h
.LABEL.__LABEL25:
	DEFW 0001h
	DEFB 00h
	;; --- end of user code ---
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/border.asm"
	; __FASTCALL__ Routine to change de border
	; Parameter (color) specified in A register

	    push namespace core

	BORDER EQU 229Bh

	    pop namespace


	; Nothing to do! (Directly from the ZX Spectrum ROM)
#line 243 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/cls.asm"
	;; Clears the user screen (24 rows)

#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/sysvars.asm"
	;; -----------------------------------------------------------------------
	;; ZX Basic System Vars
	;; Some of them will be mapped over Sinclair ROM ones for compatibility
	;; -----------------------------------------------------------------------

	push namespace core

SCREEN_ADDR:        DW 16384  ; Screen address (can be pointed to other place to use a screen buffer)
SCREEN_ATTR_ADDR:   DW 22528  ; Screen attribute address (ditto.)

	; These are mapped onto ZX Spectrum ROM VARS

	CHARS               EQU 23606  ; Pointer to ROM/RAM Charset
	TV_FLAG             EQU 23612  ; TV Flags
	UDG                 EQU 23675  ; Pointer to UDG Charset
	COORDS              EQU 23677  ; Last PLOT coordinates
	FLAGS2              EQU 23681  ;
	ECHO_E              EQU 23682  ;
	DFCC                EQU 23684  ; Next screen addr for PRINT
	DFCCL               EQU 23686  ; Next screen attr for PRINT
	S_POSN              EQU 23688
	ATTR_P              EQU 23693  ; Current Permanent ATTRS set with INK, PAPER, etc commands
	ATTR_T              EQU 23695  ; temporary ATTRIBUTES
	P_FLAG              EQU 23697  ;
	MEM0                EQU 23698  ; Temporary memory buffer used by ROM chars

	SCR_COLS            EQU 33     ; Screen with in columns + 1
	SCR_ROWS            EQU 24     ; Screen height in rows
	SCR_SIZE            EQU (SCR_ROWS << 8) + SCR_COLS
	pop namespace
#line 4 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/cls.asm"


	    push namespace core

CLS:
	    PROC
	    call        __zxnbackup_sysvar_bank
	    ld hl, 0
	    ld (COORDS), hl
	    ld hl, SCR_SIZE
	    ld (S_POSN), hl
	    ld hl, (SCREEN_ADDR)
	    ld (DFCC), hl
	    ld (hl), 0
	    ld d, h
	    ld e, l
	    inc de
	    ld bc, 6143
	    ldir

	    ; Now clear attributes

	    ld hl, (SCREEN_ATTR_ADDR)
	    ld (DFCCL), hl
	    ld d, h
	    ld e, l
	    inc de
	    ld a, (ATTR_P)
	    ld (hl), a
	    ld bc, 767
	    ldir
	    jp __zxnbackup_sysvar_bank_restore


	    ENDP

	    pop namespace
#line 244 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/free.asm"
; vim: ts=4:et:sw=4:
	; Copyleft (K) by Jose M. Rodriguez de la Rosa
	;  (a.k.a. Boriel)
;  http://www.boriel.com
	;
	; This ASM library is licensed under the BSD license
	; you can use it for any purpose (even for commercial
	; closed source programs).
	;
	; Please read the BSD license on the internet

	; ----- IMPLEMENTATION NOTES ------
	; The heap is implemented as a linked list of free blocks.

; Each free block contains this info:
	;
	; +----------------+ <-- HEAP START
	; | Size (2 bytes) |
	; |        0       | <-- Size = 0 => DUMMY HEADER BLOCK
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   | <-- If Size > 4, then this contains (size - 4) bytes
	; | (0 if Size = 4)|   |
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   |
	; | (0 if Size = 4)|   |
	; +----------------+   |
	;   <Allocated>        | <-- This zone is in use (Already allocated)
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   |
	; | (0 if Size = 4)|   |
	; +----------------+ <-+
	; | Next (2 bytes) |--> NULL => END OF LIST
	; |    0 = NULL    |
	; +----------------+
	; | <free bytes...>|
	; | (0 if Size = 4)|
	; +----------------+


	; When a block is FREED, the previous and next pointers are examined to see
	; if we can defragment the heap. If the block to be breed is just next to the
	; previous, or to the next (or both) they will be converted into a single
	; block (so defragmented).


	;   MEMORY MANAGER
	;
	; This library must be initialized calling __MEM_INIT with
	; HL = BLOCK Start & DE = Length.

	; An init directive is useful for initialization routines.
	; They will be added automatically if needed.

#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/heapinit.asm"
; vim: ts=4:et:sw=4:
	; Copyleft (K) by Jose M. Rodriguez de la Rosa
	;  (a.k.a. Boriel)
;  http://www.boriel.com
	;
	; This ASM library is licensed under the BSD license
	; you can use it for any purpose (even for commercial
	; closed source programs).
	;
	; Please read the BSD license on the internet

	; ----- IMPLEMENTATION NOTES ------
	; The heap is implemented as a linked list of free blocks.

; Each free block contains this info:
	;
	; +----------------+ <-- HEAP START
	; | Size (2 bytes) |
	; |        0       | <-- Size = 0 => DUMMY HEADER BLOCK
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   | <-- If Size > 4, then this contains (size - 4) bytes
	; | (0 if Size = 4)|   |
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   |
	; | (0 if Size = 4)|   |
	; +----------------+   |
	;   <Allocated>        | <-- This zone is in use (Already allocated)
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   |
	; | (0 if Size = 4)|   |
	; +----------------+ <-+
	; | Next (2 bytes) |--> NULL => END OF LIST
	; |    0 = NULL    |
	; +----------------+
	; | <free bytes...>|
	; | (0 if Size = 4)|
	; +----------------+


	; When a block is FREED, the previous and next pointers are examined to see
	; if we can defragment the heap. If the block to be breed is just next to the
	; previous, or to the next (or both) they will be converted into a single
	; block (so defragmented).


	;   MEMORY MANAGER
	;
	; This library must be initialized calling __MEM_INIT with
	; HL = BLOCK Start & DE = Length.

	; An init directive is useful for initialization routines.
	; They will be added automatically if needed.




	; ---------------------------------------------------------------------
	;  __MEM_INIT must be called to initalize this library with the
	; standard parameters
	; ---------------------------------------------------------------------
	    push namespace core

__MEM_INIT: ; Initializes the library using (RAMTOP) as start, and
	    ld hl, ZXBASIC_MEM_HEAP  ; Change this with other address of heap start
	    ld de, ZXBASIC_HEAP_SIZE ; Change this with your size

	; ---------------------------------------------------------------------
	;  __MEM_INIT2 initalizes this library
; Parameters:
;   HL : Memory address of 1st byte of the memory heap
;   DE : Length in bytes of the Memory Heap
	; ---------------------------------------------------------------------
__MEM_INIT2:
	    ; HL as TOP
	    PROC

	    dec de
	    dec de
	    dec de
	    dec de        ; DE = length - 4; HL = start
	    ; This is done, because we require 4 bytes for the empty dummy-header block

	    xor a
	    ld (hl), a
	    inc hl
    ld (hl), a ; First "free" block is a header: size=0, Pointer=&(Block) + 4
	    inc hl

	    ld b, h
	    ld c, l
	    inc bc
	    inc bc      ; BC = starts of next block

	    ld (hl), c
	    inc hl
	    ld (hl), b
	    inc hl      ; Pointer to next block

	    ld (hl), e
	    inc hl
	    ld (hl), d
	    inc hl      ; Block size (should be length - 4 at start); This block contains all the available memory

	    ld (hl), a ; NULL (0000h) ; No more blocks (a list with a single block)
	    inc hl
	    ld (hl), a

	    ld a, 201
	    ld (__MEM_INIT), a; "Pokes" with a RET so ensure this routine is not called again
	    ret

	    ENDP

	    pop namespace

#line 69 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/free.asm"

	; ---------------------------------------------------------------------
	; MEM_FREE
	;  Frees a block of memory
	;
; Parameters:
	;  HL = Pointer to the block to be freed. If HL is NULL (0) nothing
	;  is done
	; ---------------------------------------------------------------------

	    push namespace core

MEM_FREE:
__MEM_FREE: ; Frees the block pointed by HL
	    ; HL DE BC & AF modified
	    PROC

	    LOCAL __MEM_LOOP2
	    LOCAL __MEM_LINK_PREV
	    LOCAL __MEM_JOIN_TEST
	    LOCAL __MEM_BLOCK_JOIN

	    ld a, h
	    or l
	    ret z       ; Return if NULL pointer

	    dec hl
	    dec hl
	    ld b, h
	    ld c, l    ; BC = Block pointer

	    ld hl, ZXBASIC_MEM_HEAP  ; This label point to the heap start

__MEM_LOOP2:
	    inc hl
	    inc hl     ; Next block ptr

	    ld e, (hl)
	    inc hl
	    ld d, (hl) ; Block next ptr
	    ex de, hl  ; DE = &(block->next); HL = block->next

	    ld a, h    ; HL == NULL?
	    or l
	    jp z, __MEM_LINK_PREV; if so, link with previous

	    or a       ; Clear carry flag
	    sbc hl, bc ; Carry if BC > HL => This block if before
	    add hl, bc ; Restores HL, preserving Carry flag
	    jp c, __MEM_LOOP2 ; This block is before. Keep searching PASS the block

	;------ At this point current HL is PAST BC, so we must link (DE) with BC, and HL in BC->next

__MEM_LINK_PREV:    ; Link (DE) with BC, and BC->next with HL
	    ex de, hl
	    push hl
	    dec hl

	    ld (hl), c
	    inc hl
	    ld (hl), b ; (DE) <- BC

	    ld h, b    ; HL <- BC (Free block ptr)
	    ld l, c
	    inc hl     ; Skip block length (2 bytes)
	    inc hl
	    ld (hl), e ; Block->next = DE
	    inc hl
	    ld (hl), d
	    ; --- LINKED ; HL = &(BC->next) + 2

	    call __MEM_JOIN_TEST
	    pop hl

__MEM_JOIN_TEST:   ; Checks for fragmented contiguous blocks and joins them
	    ; hl = Ptr to current block + 2
	    ld d, (hl)
	    dec hl
	    ld e, (hl)
	    dec hl
	    ld b, (hl) ; Loads block length into BC
	    dec hl
	    ld c, (hl) ;

	    push hl    ; Saves it for later
	    add hl, bc ; Adds its length. If HL == DE now, it must be joined
	    or a
	    sbc hl, de ; If Z, then HL == DE => We must join
	    pop hl
	    ret nz

__MEM_BLOCK_JOIN:  ; Joins current block (pointed by HL) with next one (pointed by DE). HL->length already in BC
	    push hl    ; Saves it for later
	    ex de, hl

	    ld e, (hl) ; DE -> block->next->length
	    inc hl
	    ld d, (hl)
	    inc hl

	    ex de, hl  ; DE = &(block->next)
	    add hl, bc ; HL = Total Length

	    ld b, h
	    ld c, l    ; BC = Total Length

	    ex de, hl
	    ld e, (hl)
	    inc hl
	    ld d, (hl) ; DE = block->next

	    pop hl     ; Recovers Pointer to block
	    ld (hl), c
	    inc hl
	    ld (hl), b ; Length Saved
	    inc hl
	    ld (hl), e
	    inc hl
	    ld (hl), d ; Next saved
	    ret

	    ENDP

	    pop namespace

#line 245 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/ink.asm"
	; Sets ink color in ATTR_P permanently
; Parameter: Paper color in A register



	    push namespace core

INK:
	    PROC
	    LOCAL __SET_INK
	    LOCAL __SET_INK2
	    call   __zxnbackup_sysvar_bank
	    ld de, ATTR_P

__SET_INK:
	    cp 8
	    jr nz, __SET_INK2

	    inc de ; Points DE to MASK_T or MASK_P
	    ld a, (de)
	    or 7 ; Set bits 0,1,2 to enable transparency
	    ld (de), a
	    jp    __zxnbackup_sysvar_bank_restore

__SET_INK2:
	    ; Another entry. This will set the ink color at location pointer by DE
	    and 7	; # Gets color mod 8
	    ld b, a	; Saves the color
	    ld a, (de)
	    and 0F8h ; Clears previous value
	    or b
	    ld (de), a
	    inc de ; Points DE to MASK_T or MASK_P
	    ld a, (de)
	    and 0F8h ; Reset bits 0,1,2 sign to disable transparency
	    ld (de), a ; Store new attr
	    jp    __zxnbackup_sysvar_bank_restore

	; Sets the INK color passed in A register in the ATTR_T variable
INK_TMP:
	    ld de, ATTR_T
	    jp __SET_INK
	    ENDP

	    pop namespace

#line 246 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/io/keyboard/inkey.asm"
	; INKEY Function
	; Returns a string allocated in dynamic memory
	; containing the string.
	; An empty string otherwise.

#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/alloc.asm"
; vim: ts=4:et:sw=4:
	; Copyleft (K) by Jose M. Rodriguez de la Rosa
	;  (a.k.a. Boriel)
;  http://www.boriel.com
	;
	; This ASM library is licensed under the MIT license
	; you can use it for any purpose (even for commercial
	; closed source programs).
	;
	; Please read the MIT license on the internet

	; ----- IMPLEMENTATION NOTES ------
	; The heap is implemented as a linked list of free blocks.

; Each free block contains this info:
	;
	; +----------------+ <-- HEAP START
	; | Size (2 bytes) |
	; |        0       | <-- Size = 0 => DUMMY HEADER BLOCK
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   | <-- If Size > 4, then this contains (size - 4) bytes
	; | (0 if Size = 4)|   |
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   |
	; | (0 if Size = 4)|   |
	; +----------------+   |
	;   <Allocated>        | <-- This zone is in use (Already allocated)
	; +----------------+ <-+
	; | Size (2 bytes) |
	; +----------------+
	; | Next (2 bytes) |---+
	; +----------------+   |
	; | <free bytes...>|   |
	; | (0 if Size = 4)|   |
	; +----------------+ <-+
	; | Next (2 bytes) |--> NULL => END OF LIST
	; |    0 = NULL    |
	; +----------------+
	; | <free bytes...>|
	; | (0 if Size = 4)|
	; +----------------+


	; When a block is FREED, the previous and next pointers are examined to see
	; if we can defragment the heap. If the block to be freed is just next to the
	; previous, or to the next (or both) they will be converted into a single
	; block (so defragmented).


	;   MEMORY MANAGER
	;
	; This library must be initialized calling __MEM_INIT with
	; HL = BLOCK Start & DE = Length.

	; An init directive is useful for initialization routines.
	; They will be added automatically if needed.

#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/error.asm"
	; Simple error control routines
; vim:ts=4:et:

	    push namespace core

	ERR_NR    EQU    23610    ; Error code system variable


	; Error code definitions (as in ZX spectrum manual)

; Set error code with:
	;    ld a, ERROR_CODE
	;    ld (ERR_NR), a


	ERROR_Ok                EQU    -1
	ERROR_SubscriptWrong    EQU     2
	ERROR_OutOfMemory       EQU     3
	ERROR_OutOfScreen       EQU     4
	ERROR_NumberTooBig      EQU     5
	ERROR_InvalidArg        EQU     9
	ERROR_IntOutOfRange     EQU    10
	ERROR_NonsenseInBasic   EQU    11
	ERROR_InvalidFileName   EQU    14
	ERROR_InvalidColour     EQU    19
	ERROR_BreakIntoProgram  EQU    20
	ERROR_TapeLoadingErr    EQU    26


	; Raises error using RST #8
__ERROR:
	    ld (__ERROR_CODE), a
	    rst 8
__ERROR_CODE:
	    nop
	    ret

	; Sets the error system variable, but keeps running.
	; Usually this instruction if followed by the END intermediate instruction.
__STOP:
	    ld (ERR_NR), a
	    ret

	    pop namespace
#line 69 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/alloc.asm"



	; ---------------------------------------------------------------------
	; MEM_ALLOC
	;  Allocates a block of memory in the heap.
	;
	; Parameters
	;  BC = Length of requested memory block
	;
; Returns:
	;  HL = Pointer to the allocated block in memory. Returns 0 (NULL)
	;       if the block could not be allocated (out of memory)
	; ---------------------------------------------------------------------

	    push namespace core

MEM_ALLOC:
__MEM_ALLOC: ; Returns the 1st free block found of the given length (in BC)
	    PROC

	    LOCAL __MEM_LOOP
	    LOCAL __MEM_DONE
	    LOCAL __MEM_SUBTRACT
	    LOCAL __MEM_START
	    LOCAL TEMP, TEMP0

	TEMP EQU TEMP0 + 1

	    ld hl, 0
	    ld (TEMP), hl

__MEM_START:
	    ld hl, ZXBASIC_MEM_HEAP  ; This label point to the heap start
	    inc bc
	    inc bc  ; BC = BC + 2 ; block size needs 2 extra bytes for hidden pointer

__MEM_LOOP:  ; Loads lengh at (HL, HL+). If Lenght >= BC, jump to __MEM_DONE
	    ld a, h ;  HL = NULL (No memory available?)
	    or l
#line 113 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/alloc.asm"
	    ret z ; NULL
#line 115 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/alloc.asm"
	    ; HL = Pointer to Free block
	    ld e, (hl)
	    inc hl
	    ld d, (hl)
	    inc hl          ; DE = Block Length

	    push hl         ; HL = *pointer to -> next block
	    ex de, hl
	    or a            ; CF = 0
	    sbc hl, bc      ; FREE >= BC (Length)  (HL = BlockLength - Length)
	    jp nc, __MEM_DONE
	    pop hl
	    ld (TEMP), hl

	    ex de, hl
	    ld e, (hl)
	    inc hl
	    ld d, (hl)
	    ex de, hl
	    jp __MEM_LOOP

__MEM_DONE:  ; A free block has been found.
	    ; Check if at least 4 bytes remains free (HL >= 4)
	    push hl
	    exx  ; exx to preserve bc
	    pop hl
	    ld bc, 4
	    or a
	    sbc hl, bc
	    exx
	    jp nc, __MEM_SUBTRACT
	    ; At this point...
	    ; less than 4 bytes remains free. So we return this block entirely
	    ; We must link the previous block with the next to this one
	    ; (DE) => Pointer to next block
	    ; (TEMP) => &(previous->next)
	    pop hl     ; Discard current block pointer
	    push de
	    ex de, hl  ; DE = Previous block pointer; (HL) = Next block pointer
	    ld a, (hl)
	    inc hl
	    ld h, (hl)
	    ld l, a    ; HL = (HL)
	    ex de, hl  ; HL = Previous block pointer; DE = Next block pointer
TEMP0:
	    ld hl, 0   ; Pre-previous block pointer

	    ld (hl), e
	    inc hl
	    ld (hl), d ; LINKED
	    pop hl ; Returning block.

	    ret

__MEM_SUBTRACT:
	    ; At this point we have to store HL value (Length - BC) into (DE - 2)
	    ex de, hl
	    dec hl
	    ld (hl), d
	    dec hl
	    ld (hl), e ; Store new block length

	    add hl, de ; New length + DE => free-block start
	    pop de     ; Remove previous HL off the stack

	    ld (hl), c ; Store length on its 1st word
	    inc hl
	    ld (hl), b
	    inc hl     ; Return hl
	    ret

	    ENDP

	    pop namespace

#line 7 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/io/keyboard/inkey.asm"

	    push namespace core

INKEY:
	    PROC
	    LOCAL __EMPTY_INKEY
	    LOCAL KEY_SCAN
	    LOCAL KEY_TEST
	    LOCAL KEY_CODE

	    ld bc, 3	; 1 char length string
	    call __MEM_ALLOC

	    ld a, h
	    or l
	    ret z	; Return if NULL (No memory)

	    push hl ; Saves memory pointer

	    call KEY_SCAN
	    jp nz, __EMPTY_INKEY

	    call KEY_TEST
	    jp nc, __EMPTY_INKEY

	    dec d	; D is expected to be FLAGS so set bit 3 $FF
	    ; 'L' Mode so no keywords.
	    ld e, a	; main key to A
	    ; C is MODE 0 'KLC' from above still.
	    call KEY_CODE ; routine K-DECODE
	    pop hl

	    ld (hl), 1
	    inc hl
	    ld (hl), 0
	    inc hl
	    ld (hl), a
	    dec hl
	    dec hl	; HL Points to string result
	    ret

__EMPTY_INKEY:
	    pop hl
	    xor a
	    ld (hl), a
	    inc hl
	    ld (hl), a
	    dec hl
	    ret

	KEY_SCAN	EQU 028Eh
	KEY_TEST	EQU 031Eh
	KEY_CODE	EQU 0333h

	    ENDP

	    pop namespace
#line 247 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/loadstr.asm"


	; Loads a string (ptr) from HL
	; and duplicates it on dynamic memory again
	; Finally, it returns result pointer in HL

	    push namespace core

__ILOADSTR:		; This is the indirect pointer entry HL = (HL)
	    ld a, h
	    or l
	    ret z
	    ld a, (hl)
	    inc hl
	    ld h, (hl)
	    ld l, a

__LOADSTR:		; __FASTCALL__ entry
	    ld a, h
	    or l
	    ret z	; Return if NULL

	    ld c, (hl)
	    inc hl
	    ld b, (hl)
	    dec hl  ; BC = LEN(a$)

	    inc bc
	    inc bc	; BC = LEN(a$) + 2 (two bytes for length)

	    push hl
	    push bc
	    call __MEM_ALLOC
	    pop bc  ; Recover length
	    pop de  ; Recover origin

	    ld a, h
	    or l
	    ret z	; Return if NULL (No memory)

	    ex de, hl ; ldir takes HL as source, DE as destiny, so SWAP HL,DE
	    push de	; Saves destiny start
	    ldir	; Copies string (length number included)
	    pop hl	; Recovers destiny in hl as result
	    ret

	    pop namespace
#line 248 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/paper.asm"
	; Sets paper color in ATTR_P permanently
; Parameter: Paper color in A register



	    push namespace core

PAPER:
	    PROC
	    LOCAL __SET_PAPER
	    LOCAL __SET_PAPER2
	    call        __zxnbackup_sysvar_bank
	    ld de, ATTR_P

__SET_PAPER:
	    cp 8
	    jr nz, __SET_PAPER2
	    inc de
	    ld a, (de)
	    or 038h
	    ld (de), a
	    jp        __zxnbackup_sysvar_bank_restore

	    ; Another entry. This will set the paper color at location pointer by DE
__SET_PAPER2:
	    and 7	; # Remove
	    rlca
	    rlca
	    rlca		; a *= 8

	    ld b, a	; Saves the color
	    ld a, (de)
	    and 0C7h ; Clears previous value
	    or b
	    ld (de), a
	    inc de ; Points to MASK_T or MASK_P accordingly
	    ld a, (de)
	    and 0C7h  ; Resets bits 3,4,5
	    ld (de), a
	    jp        __zxnbackup_sysvar_bank_restore


	; Sets the PAPER color passed in A register in the ATTR_T variable
PAPER_TMP:
	    call        __zxnbackup_sysvar_bank
	    ld de, ATTR_T
	    jp __SET_PAPER
	    ENDP

	    pop namespace

#line 249 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/pstorestr2.asm"
; vim:ts=4:et:sw=4
	;
	; Stores an string (pointer to the HEAP by DE) into the address pointed
	; by (IX + BC). No new copy of the string is created into the HEAP, since
	; it's supposed it's already created (temporary string)
	;

#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/storestr2.asm"
	; Similar to __STORE_STR, but this one is called when
	; the value of B$ if already duplicated onto the stack.
	; So we needn't call STRASSING to create a duplication
	; HL = address of string memory variable
	; DE = address of 2n string. It just copies DE into (HL)
	; 	freeing (HL) previously.



	    push namespace core

__PISTORE_STR2: ; Indirect store temporary string at (IX + BC)
	    push ix
	    pop hl
	    add hl, bc

__ISTORE_STR2:
	    ld c, (hl)  ; Dereferences HL
	    inc hl
	    ld h, (hl)
	    ld l, c		; HL = *HL (real string variable address)

__STORE_STR2:
	    push hl
	    ld c, (hl)
	    inc hl
	    ld h, (hl)
	    ld l, c		; HL = *HL (real string address)

	    push de
	    call __MEM_FREE
	    pop de

	    pop hl
	    ld (hl), e
	    inc hl
	    ld (hl), d
	    dec hl		; HL points to mem address variable. This might be useful in the future.

	    ret

	    pop namespace

#line 9 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/pstorestr2.asm"

	    push namespace core

__PSTORE_STR2:
	    push ix
	    pop hl
	    add hl, bc
	    jp __STORE_STR2

	    pop namespace

#line 250 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"

#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/str.asm"
	; The STR$( ) BASIC function implementation

	; Given a FP number in C ED LH
	; Returns a pointer (in HL) to the memory heap
	; containing the FP number string representation


#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/stackf.asm"
	; -------------------------------------------------------------
	; Functions to manage FP-Stack of the ZX Spectrum ROM CALC
	; -------------------------------------------------------------


	    push namespace core

	__FPSTACK_PUSH EQU 2AB6h	; Stores an FP number into the ROM FP stack (A, ED CB)
	__FPSTACK_POP  EQU 2BF1h	; Pops an FP number out of the ROM FP stack (A, ED CB)

__FPSTACK_PUSH2: ; Pushes Current A ED CB registers and top of the stack on (SP + 4)
	    ; Second argument to push into the stack calculator is popped out of the stack
	    ; Since the caller routine also receives the parameters into the top of the stack
	    ; four bytes must be removed from SP before pop them out

	    call __FPSTACK_PUSH ; Pushes A ED CB into the FP-STACK
	    exx
	    pop hl       ; Caller-Caller return addr
	    exx
	    pop hl       ; Caller return addr

	    pop af
	    pop de
	    pop bc

	    push hl      ; Caller return addr
	    exx
	    push hl      ; Caller-Caller return addr
	    exx

	    ;jp __zxnbackup_sysvar_bank_restore
	    jp __FPSTACK_PUSH


__FPSTACK_I16:	; Pushes 16 bits integer in HL into the FP ROM STACK
	    ; This format is specified in the ZX 48K Manual
	    ; You can push a 16 bit signed integer as
	    ; 0 SS LL HH 0, being SS the sign and LL HH the low
	    ; and High byte respectively
	    ld a, h
	    rla			; sign to Carry
	    sbc	a, a	; 0 if positive, FF if negative
	    ld e, a
	    ld d, l
	    ld c, h
	    xor a
	    ld b, a
	    jp __FPSTACK_PUSH

	    pop namespace
#line 9 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/str.asm"


	    push namespace core

__STR:

__STR_FAST:

	    PROC
	    LOCAL __STR_END
	    LOCAL RECLAIM2
	    LOCAL STK_END

	    ld hl, (STK_END)
	    push hl; Stores STK_END
	    ld hl, (ATTR_T)	; Saves ATTR_T since it's changed by STR$ due to a ROM BUG
	    push hl

	    call __FPSTACK_PUSH ; Push number into stack
	    rst 28h		; # Rom Calculator
	    defb 2Eh	; # STR$(x)
	    defb 38h	; # END CALC
	    call __FPSTACK_POP ; Recovers string parameters to A ED CB (Only ED LH are important)

	    pop hl
	    ld (ATTR_T), hl	; Restores ATTR_T
	    pop hl
	    ld (STK_END), hl	; Balance STK_END to avoid STR$ bug

	    push bc
	    push de

	    inc bc
	    inc bc
	    call __MEM_ALLOC ; HL Points to new block

	    pop de
	    pop bc

	    push hl
	    ld a, h
	    or l
	    jr z, __STR_END  ; Return if NO MEMORY (NULL)

	    push bc
	    push de
	    ld (hl), c
	    inc hl
	    ld (hl), b
	    inc hl		; Copies length

	    ex de, hl	; HL = start of original string
	    ldir		; Copies string content

	    pop de		; Original (ROM-CALC) string
	    pop bc		; Original Length

__STR_END:
	    ex de, hl
	    inc bc

	    call RECLAIM2 ; Frees TMP Memory
	    pop hl		  ; String result

	    ret

	RECLAIM2 EQU 19E8h
	STK_END EQU 5C65h

	    ENDP

	    pop namespace

#line 252 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/strcat.asm"

#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/strlen.asm"
	; Returns len if a string
	; If a string is NULL, its len is also 0
	; Result returned in HL

	    push namespace core

__STRLEN:	; Direct FASTCALL entry
	    ld a, h
	    or l
	    ret z

	    ld a, (hl)
	    inc hl
	    ld h, (hl)  ; LEN(str) in HL
	    ld l, a
	    ret

	    pop namespace


#line 3 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/strcat.asm"

	    push namespace core

__ADDSTR:	; Implements c$ = a$ + b$
	    ; hl = &a$, de = &b$ (pointers)


__STRCAT2:	; This routine creates a new string in dynamic space
	    ; making room for it. Then copies a$ + b$ into it.
	    ; HL = a$, DE = b$

	    PROC

	    LOCAL __STR_CONT
	    LOCAL __STRCATEND

	    push hl
	    call __STRLEN
	    ld c, l
	    ld b, h		; BC = LEN(a$)
	    ex (sp), hl ; (SP) = LEN (a$), HL = a$
	    push hl		; Saves pointer to a$

	    inc bc
	    inc bc		; +2 bytes to store length

	    ex de, hl
	    push hl
	    call __STRLEN
	    ; HL = len(b$)

	    add hl, bc	; Total str length => 2 + len(a$) + len(b$)

	    ld c, l
	    ld b, h		; BC = Total str length + 2
	    call __MEM_ALLOC
	    pop de		; HL = c$, DE = b$

	    ex de, hl	; HL = b$, DE = c$
	    ex (sp), hl ; HL = a$, (SP) = b$

	    exx
	    pop de		; D'E' = b$
	    exx

	    pop bc		; LEN(a$)

	    ld a, d
	    or e
    ret z		; If no memory: RETURN

__STR_CONT:
	    push de		; Address of c$

	    ld a, h
	    or l
	    jr nz, __STR_CONT1 ; If len(a$) != 0 do copy

	    ; a$ is NULL => uses HL = DE for transfer
	    ld h, d
	    ld l, e
	    ld (hl), a	; This will copy 00 00 at (DE) location
	    inc de      ;
	    dec bc      ; Ensure BC will be set to 1 in the next step

__STR_CONT1:        ; Copies a$ (HL) into c$ (DE)
	    inc bc
	    inc bc		; BC = BC + 2
    ldir		; MEMCOPY: c$ = a$
	    pop hl		; HL = c$

	    exx
	    push de		; Recovers b$; A ex hl,hl' would be very handy
	    exx

	    pop de		; DE = b$

__STRCAT: ; ConCATenate two strings a$ = a$ + b$. HL = ptr to a$, DE = ptr to b$
    ; NOTE: Both DE, BC and AF are modified and lost
	    ; Returns HL (pointer to a$)
	    ; a$ Must be NOT NULL
	    ld a, d
	    or e
	    ret z		; Returns if de is NULL (nothing to copy)

	    push hl		; Saves HL to return it later

	    ld c, (hl)
	    inc hl
	    ld b, (hl)
	    inc hl
	    add hl, bc	; HL = end of (a$) string ; bc = len(a$)
	    push bc		; Saves LEN(a$) for later

	    ex de, hl	; DE = end of string (Begin of copy addr)
	    ld c, (hl)
	    inc hl
	    ld b, (hl)	; BC = len(b$)

	    ld a, b
	    or c
	    jr z, __STRCATEND; Return if len(b$) == 0

	    push bc			 ; Save LEN(b$)
	    inc hl			 ; Skip 2nd byte of len(b$)
	    ldir			 ; Concatenate b$

	    pop bc			 ; Recovers length (b$)
	    pop hl			 ; Recovers length (a$)
	    add hl, bc		 ; HL = LEN(a$) + LEN(b$) = LEN(a$+b$)
	    ex de, hl		 ; DE = LEN(a$+b$)
	    pop hl

	    ld (hl), e		 ; Updates new LEN and return
	    inc hl
	    ld (hl), d
	    dec hl
	    ret

__STRCATEND:
	    pop hl		; Removes Len(a$)
	    pop hl		; Restores original HL, so HL = a$
	    ret

	    ENDP

	    pop namespace

#line 253 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/string.asm"
	; String library




	    push namespace core

__STR_ISNULL:	; Returns A = FF if HL is 0, 0 otherwise
	    ld a, h
	    or l
	    sub 1		; Only CARRY if HL is NULL
	    sbc a, a	; Only FF if HL is NULL (0 otherwise)
	    ret


__STRCMP:	; Compares strings at HL (a$), DE (b$)
	            ; Returns 0 if EQual, -1 if HL < DE, +1 if HL > DE
	    ; A register is preserved and returned in A'
	    PROC ; __FASTCALL__

	    LOCAL __STRCMPZERO
	    LOCAL __STRCMPEXIT
	    LOCAL __STRCMPLOOP
	    LOCAL __EQULEN1
	    LOCAL __HLZERO

	    ex af, af'	; Saves current A register in A' (it's used by STRXX comparison functions)

	    push hl
	    call __STRLEN
	    ld a, h
	    or l
	    pop hl
	    jr z, __HLZERO  ; if HL == "", go to __HLZERO

	    push de
	    ex de, hl
	    call __STRLEN
	    ld a, h
	    or l
	    ld a, 1
	    ex de, hl   ; Recovers HL
	    pop de
	    ret z		; Returns +1 if HL != "" AND DE == ""

	    ld c, (hl)
	    inc hl
	    ld b, (hl)
	    inc hl		; BC = LEN(a$)
	    push hl		; HL = &a$, saves it

	    ex de, hl
	    ld e, (hl)
	    inc hl
	    ld d, (hl)
	    inc hl
	    ex de, hl	; HL = LEN(b$), de = &b$

	    ; At this point Carry is cleared, and A reg. = 1
	    sbc hl, bc	     ; Carry if len(a$)[BC] > len(b$)[HL]

	    ld a, 0
    jr z, __EQULEN1	 ; Jumps if len(a$)[BC] = len(b$)[HL] : A = 0

	    dec a
    jr nc, __EQULEN1 ; Jumps if len(a$)[BC] < len(b$)[HL] : A = 1

	    adc hl, bc  ; Restores HL
    ld a, 1     ; Signals len(a$)[BC] > len(b$)[HL] : A = 1
	    ld b, h
	    ld c, l

__EQULEN1:
	    pop hl		; Recovers A$ pointer
	    push af		; Saves A for later (Value to return if strings reach the end)
	    ld a, b
	    or c
	    jr z, __STRCMPZERO ; empty string being compared

    ; At this point: BC = lesser length, DE and HL points to b$ and a$ chars respectively
__STRCMPLOOP:
	    ld a, (de)
	    cpi
	    jr nz, __STRCMPEXIT ; (HL) != (DE). Examine carry
	    jp po, __STRCMPZERO ; END of string (both are equal)
	    inc de
	    jp __STRCMPLOOP

__STRCMPZERO:
	    pop af		; This is -1 if len(a$) < len(b$), +1 if len(b$) > len(a$), 0 otherwise
	    ret

__STRCMPEXIT:		; Sets A with the following value
	    dec hl		; Get back to the last char
	    cp (hl)
	    sbc a, a	; A = -1 if carry => (DE) < (HL); 0 otherwise (DE) > (HL)
	    cpl			; A = -1 if (HL) < (DE), 0 otherwise
	    add a, a    ; A = A * 2 (thus -2 or 0)
	    inc a		; A = A + 1 (thus -1 or 1)

	    pop bc		; Discard top of the stack
	    ret

__HLZERO:
	    ex de, hl
	    call __STRLEN
	    ld a, h
	    or l
	    ret z		; Returns 0 (EQ) if HL == DE == ""
	    ld a, -1
	    ret			; Returns -1 if HL == "" and DE != ""

	    ENDP

	    ; The following routines perform string comparison operations (<, >, ==, etc...)
	    ; On return, A will contain 0 for False, other value for True
	    ; Register A' will determine whether the incoming strings (HL, DE) will be freed
    ; from dynamic memory on exit:
	    ;		Bit 0 => 1 means HL will be freed.
	    ;		Bit 1 => 1 means DE will be freed.

__STREQ:	; Compares a$ == b$ (HL = ptr a$, DE = ptr b$). Returns FF (True) or 0 (False)
	    push hl
	    push de
	    call __STRCMP
	    pop de
	    pop hl
	    sub 1
	    sbc a, a
	    jp __FREE_STR


__STRNE:	; Compares a$ != b$ (HL = ptr a$, DE = ptr b$). Returns FF (True) or 0 (False)
	    push hl
	    push de
	    call __STRCMP
	    pop de
	    pop hl
	    jp __FREE_STR


__STRLT:	; Compares a$ < b$ (HL = ptr a$, DE = ptr b$). Returns FF (True) or 0 (False)
	    push hl
	    push de
	    call __STRCMP
	    pop de
	    pop hl
	    or a
	    jp z, __FREE_STR ; Returns 0 if A == B

	    dec a		; Returns 0 if A == 1 => a$ > b$
	    jp __FREE_STR


__STRLE:	; Compares a$ <= b$ (HL = ptr a$, DE = ptr b$). Returns FF (True) or 0 (False)
	    push hl
	    push de
	    call __STRCMP
	    pop de
	    pop hl

	    dec a		; Returns 0 if A == 1 => a$ < b$
	    jp __FREE_STR


__STRGT:	; Compares a$ > b$ (HL = ptr a$, DE = ptr b$). Returns FF (True) or 0 (False)
	    push hl
	    push de
	    call __STRCMP
	    pop de
	    pop hl
	    or a
	    jp z, __FREE_STR		; Returns 0 if A == B

	    inc a		; Returns 0 if A == -1 => a$ < b$
	    jp __FREE_STR


__STRGE:	; Compares a$ >= b$ (HL = ptr a$, DE = ptr b$). Returns FF (True) or 0 (False)
	    push hl
	    push de
	    call __STRCMP
	    pop de
	    pop hl

	    inc a		; Returns 0 if A == -1 => a$ < b$

__FREE_STR: ; This exit point will test A' for bits 0 and 1
	    ; If bit 0 is 1 => Free memory from HL pointer
	    ; If bit 1 is 1 => Free memory from DE pointer
	    ; Finally recovers A, to return the result
	    PROC

	    LOCAL __FREE_STR2
	    LOCAL __FREE_END

	    ex af, af'
	    bit 0, a
	    jr z, __FREE_STR2

	    push af
	    push de
	    call __MEM_FREE
	    pop de
	    pop af

__FREE_STR2:
	    bit 1, a
	    jr z, __FREE_END

	    ex de, hl
	    call __MEM_FREE

__FREE_END:
	    ex af, af'
	    ret

	    ENDP

	    pop namespace
#line 254 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/u32tofreg.asm"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/neg32.asm"
	    push namespace core

__ABS32:
	    bit 7, d
	    ret z

__NEG32: ; Negates DEHL (Two's complement)
	    ld a, l
	    cpl
	    ld l, a

	    ld a, h
	    cpl
	    ld h, a

	    ld a, e
	    cpl
	    ld e, a

	    ld a, d
	    cpl
	    ld d, a

	    inc l
	    ret nz

	    inc h
	    ret nz

	    inc de
	    ret

	    pop namespace

#line 2 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/u32tofreg.asm"
	    push namespace core

__I8TOFREG:
	    ld l, a
	    rlca
	    sbc a, a	; A = SGN(A)
	    ld h, a
	    ld e, a
	    ld d, a

__I32TOFREG:	; Converts a 32bit signed integer (stored in DEHL)
	    ; to a Floating Point Number returned in (A ED CB)

	    ld a, d
	    or a		; Test sign

	    jp p, __U32TOFREG	; It was positive, proceed as 32bit unsigned

	    call __NEG32		; Convert it to positive
	    call __U32TOFREG	; Convert it to Floating point

	    set 7, e			; Put the sign bit (negative) in the 31bit of mantissa
	    ret

__U8TOFREG:
	    ; Converts an unsigned 8 bit (A) to Floating point
	    ld l, a
	    ld h, 0
	    ld e, h
	    ld d, h

__U32TOFREG:	; Converts an unsigned 32 bit integer (DEHL)
	    ; to a Floating point number returned in A ED CB

	    PROC

	    LOCAL __U32TOFREG_END

	    ld a, d
	    or e
	    or h
	    or l
	    ld b, d
	    ld c, e		; Returns 00 0000 0000 if ZERO
	    ret z

	    push de
	    push hl

	    exx
	    pop de  ; Loads integer into B'C' D'E'
	    pop bc
	    exx

	    ld l, 128	; Exponent
	    ld bc, 0	; DEBC = 0
	    ld d, b
	    ld e, c

__U32TOFREG_LOOP: ; Also an entry point for __F16TOFREG
	    exx
	    ld a, d 	; B'C'D'E' == 0 ?
	    or e
	    or b
	    or c
	    jp z, __U32TOFREG_END	; We are done

	    srl b ; Shift B'C' D'E' >> 1, output bit stays in Carry
	    rr c
	    rr d
	    rr e
	    exx

	    rr e ; Shift EDCB >> 1, inserting the carry on the left
	    rr d
	    rr c
	    rr b

	    inc l	; Increment exponent
	    jp __U32TOFREG_LOOP


__U32TOFREG_END:
	    exx
	    ld a, l     ; Puts the exponent in a
	    res 7, e	; Sets the sign bit to 0 (positive)

	    ret
	    ENDP

	    pop namespace

#line 255 "/home/usb/Documents/GitHub/NextBuildv9-Gold/Sources/NextBuild_Examples/SOUND/TurboSoundAYFX/SimpleMusic_SFXbas.bas"

	END
