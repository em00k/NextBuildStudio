	org 32768
.core.__START_PROGRAM:
	push iy
	ld iy, 0x5C3A  ; ZX Spectrum ROM variables address
	ld (.core.__CALL_BACK__), sp
	jp .core.__MAIN_PROGRAM__
.core.__CALL_BACK__:
	DEFW 0
.core.ZXBASIC_USER_DATA:
	; Defines USER DATA Length in bytes
.core.ZXBASIC_USER_DATA_LEN EQU .core.ZXBASIC_USER_DATA_END - .core.ZXBASIC_USER_DATA
	.core.__LABEL__.ZXBASIC_USER_DATA_LEN EQU .core.ZXBASIC_USER_DATA_LEN
	.core.__LABEL__.ZXBASIC_USER_DATA EQU .core.ZXBASIC_USER_DATA
_y:
	DEFB 00
_key:
	DEFB 00
_pcounter:
	DEFB 00
_pcounter2:
	DEFB 00
_position:
	DEFB 00
_sx:
	DEFB 00
_sy:
	DEFB 00
_dg:
	DEFB 80h
_dh:
	DEFB 3Ah
_delay:
	DEFB 00
_delay2:
	DEFB 00
_timer:
	DEFB 00
_timer3:
	DEFB 00
_col:
	DEFB 00
_sadd:
	DEFB 00
_a:
	DEFB 00, 00
_x:
	DEFB 00, 00
_ab:
	DEFB 00
_s:
	DEFB 00h
_coppere_xdelta:
	DEFB 00
_copperi:
	DEFB 00
_copperb:
	DEFB 00
_copper_line:
	DEFB 00
_copperc:
	DEFB 00
_copperd:
	DEFB 00
_coppere_ydelta:
	DEFB 00
_copperj:
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
#line 4227 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"




		ld iy,$5c3a



		jp endfilename


#line 4238 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
	call _check_interrupts
.LABEL._filename:
#line 4246 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

filename:
		DEFS 320,0
endfilename:

#line 4251 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
.LABEL._INTERNAL_STACK_TOP:
#line 4254 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

nbtempstackstart:
		ld sp,nbtempstackstart-2


#line 4259 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 4261 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"





		jp nextbuild_file_end



shadowlayerbit:
		db 0

#line 4273 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 4274 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"


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
#line 4277 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/arith/mul16.asm"
		push namespace core

__MUL16:


		PROC

		ex de, hl
		pop hl
		ex (sp), hl

__MUL16_FAST:
		ld a,d
		ld d,h
		ld h,a
		ld c,e
		ld b,l
		mul d,e
		ex de,hl
		mul d,e
		add hl,de
		ld e,c
		ld d,b
		mul d,e
		ld a,l
		add a,d
		ld h,a
		ld l,e

		ret

		ENDP

		pop namespace
#line 4278 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"


#line 4342 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 4525 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

nextbuild_file_end:


#line 4529 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
#line 11 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"



		nextreg TURBO_CONTROL_NR_07,%11
		nextreg GLOBAL_TRANSPARENCY_NR_14,$0
		nextreg TRANSPARENCY_FALLBACK_COL_NR_4A, 0
		nextreg VIDEO_LINE_OFFSET_NR_64,32
		nextreg PERIPHERAL_4_NR_09,%00100000











		nextreg ULA_CONTROL_NR_68,%10101000
		nextreg SPRITE_CONTROL_NR_15,%00010011


#line 34 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
	xor a
	push af
	ld a, 26
	push af
	ld hl, 0
	push hl
	ld a, 63
	call _InitSprites2
	xor a
	call _ShowLayer2
	xor a
	push af
	xor a
	push af
	xor a
	push af
	xor a
	push af
	call _ClipLayer2
	xor a
	call _ClearLayer2
	xor a
	ld (_y), a
	jp .LABEL.__LABEL0
.LABEL.__LABEL3:
	ld hl, 0
	ld (_x), hl
	jp .LABEL.__LABEL5
.LABEL.__LABEL8:
	ld hl, _col
	inc (hl)
	ld a, (_col)
	and 7
	push af
	ld a, (_y)
	push af
	ld hl, (_x)
	ld a, l
	call _PlotL2
	ld hl, (_x)
	inc hl
	inc hl
	ld (_x), hl
.LABEL.__LABEL5:
	ld hl, 256
	ld de, (_x)
	or a
	sbc hl, de
	jp nc, .LABEL.__LABEL8
	ld a, (_y)
	add a, 8
	ld (_y), a
.LABEL.__LABEL0:
	ld a, 192
	ld hl, (_y - 1)
	cp h
	jp nc, .LABEL.__LABEL3
	xor a
	ld (_y), a
	jp .LABEL.__LABEL10
.LABEL.__LABEL13:
	ld hl, 0
	ld (_x), hl
	jp .LABEL.__LABEL15
.LABEL.__LABEL18:
	ld hl, _col
	inc (hl)
	ld a, (_col)
	and 7
	push af
	ld a, (_y)
	push af
	ld hl, (_x)
	ld a, l
	call _PlotL2
	ld hl, (_x)
	ld de, 8
	add hl, de
	ld (_x), hl
.LABEL.__LABEL15:
	ld hl, 256
	ld de, (_x)
	or a
	sbc hl, de
	jp nc, .LABEL.__LABEL18
	ld a, (_y)
	add a, 2
	ld (_y), a
.LABEL.__LABEL10:
	ld a, 192
	ld hl, (_y - 1)
	cp h
	jp nc, .LABEL.__LABEL13
	ld a, 159
	push af
	ld a, 32
	push af
	ld a, 255
	push af
	xor a
	push af
	call _ClipLayer2
#line 86 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"


		ld  b, 5
		ld  a, 7
		ld  hl, 22528
		ld  de, 22529
doloopme:
		push bc
		ld  (hl),a
		ld  bc, 32
		ldir
		dec a
		pop bc
		djnz doloopme

		nextsid_init EQU 0x0000E098

		nextsid_set_waveform_A EQU 0x0000E07A
		nextsid_set_waveform_B EQU 0x0000E081
		nextsid_set_waveform_C EQU 0x0000E088
		nextsid_set_detune_A EQU 0x0000E056
		nextsid_set_detune_B EQU 0x0000E05A
		nextsid_set_detune_C EQU 0x0000E05E
		nextsid_wavelen_A EQU 0x0000E341
		nextsid_wavelen_B EQU 0x0000E36C
		nextsid_wavelen_C EQU 0x0000E397
		nextsid_shift_C EQU 0x0000E24D
		nextsid_set_shift_C EQU 0x0000E076
		nextsid_shift_B EQU 0x0000E226
		nextsid_set_shift_B EQU 0x0000E072
		nextsid_shift_A EQU 0x0000E1FF
		nextsid_set_shift_A EQU 0x0000E06E

		nextsid_play EQU 0x0000E007
		nextsid_stop EQU 0x0000E011
		nextsid_mode EQU 0x0000E2D7
		nextsid_pause EQU 0x0000E000
		nextsid_reset EQU 0x0000E38C
		nextsid_set_pt3 EQU 0x0000E025

		init EQU 0x0000E3F9
		nextsid_set_psg_clock EQU 0x0000E04E
		nextsid_vsync EQU 0x0000E08F

		nextreg 	$57,33
		irq_vector	equ	65022
		stack		equ	65021
		vector_table	equ	64512
startup:	di
		ld	sp,stack

		nextreg	TURBO_CONTROL_NR_07,%00000011

		ld	hl,vector_table
		ld	a,h
		ld	i,a
		im	2

		inc	a

		ld	b,l
	.irq:	ld	(hl),a
		inc	hl
		djnz	.irq
		ld	(hl),a

		ld	a,$FB
		ld	hl,$4DED
		ld	(irq_vector-1),a
		ld	(irq_vector),hl

		ld	bc,0xFFFD
		ld	a,%11111111
		out	(c),a


		nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000100
		nextreg VIDEO_INTERUPT_VALUE_NR_23,255

		ld	sp,stack
		ei



		ld	de,0
		ld	bc,192
		call	nextsid_init



		call	nextsid_stop


		ld	hl,test_waveformb
		ld	a,16-1


		ld	hl,16



		ld	hl,test_waveforma
		ld	a,16-1
		call	nextsid_set_waveform_A

		ld	hl,16
		call	nextsid_set_detune_A

		ld	hl,$a000
		ld	a,34
		ld	b,35

		call	nextsid_set_pt3

		nextreg $55,34
		nextreg $56,35

		call	init

		nextreg $55,5
		nextreg $56,0
		nextreg $57,33

		call	nextsid_play


#line 212 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
	ld a, 1
	call _GetReg
	and 240
	ld (_ab), a
	sub 64
	jp nz, .LABEL.__LABEL21
	ld de, 26
	ld hl, 46064
	call _setpsgclock
.LABEL.__LABEL21:
	ld hl, (.LABEL._font) - (256)
	ld (23606), hl
	ld a, 96
	push af
	ld a, 91
	call _SetupTileHW
#line 225 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"


		nextreg TILEMAP_CONTROL_NR_6B,%10100000

#line 229 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
	xor a
	push af
	ld a, 2
	push af
	ld hl, .LABEL._msg1
	push hl
	call _DrawMetaTable
	ld a, 3
	push af
	ld a, 1
	push af
	ld hl, .LABEL._msg2
	push hl
	call _DrawMetaTable
	call _ScrollerInit
	ld hl, 0
	ld (_a), hl
	xor a
	ld (_key), a
.LABEL.__LABEL22:
	call _GetKeyScanCode
	ld (_a), hl
	ld de, 63233
	ld hl, (_a)
	call .core.__EQ16
	push af
	ld a, (_key)
	sub 1
	sbc a, a
	ld h, a
	pop af
	or a
	jr z, .LABEL.__LABEL54
	ld a, h
.LABEL.__LABEL54:
	or a
	jp z, .LABEL.__LABEL24
	call _rand
	ld a, (.LABEL._rand_num1)
	ld (_dg), a
	call _rand
	ld a, (.LABEL._rand_num1)
	ld (_dh), a
	ld a, 1
	ld (_key), a
	jp .LABEL.__LABEL25
.LABEL.__LABEL24:
	ld de, 57089
	ld hl, (_a)
	call .core.__EQ16
	push af
	ld a, (_key)
	sub 1
	sbc a, a
	ld h, a
	pop af
	or a
	jr z, .LABEL.__LABEL55
	ld a, h
.LABEL.__LABEL55:
	or a
	jp z, .LABEL.__LABEL26
	ld hl, _dh
	inc (hl)
	ld a, 1
	ld (_key), a
	jp .LABEL.__LABEL25
.LABEL.__LABEL26:
	ld de, 57090
	ld hl, (_a)
	call .core.__EQ16
	push af
	ld a, (_key)
	sub 1
	sbc a, a
	ld h, a
	pop af
	or a
	jr z, .LABEL.__LABEL56
	ld a, h
.LABEL.__LABEL56:
	or a
	jp z, .LABEL.__LABEL28
	ld hl, _dh
	dec (hl)
	ld a, 1
	ld (_key), a
	jp .LABEL.__LABEL25
.LABEL.__LABEL28:
	ld de, 64257
	ld hl, (_a)
	call .core.__EQ16
	push af
	ld a, (_key)
	sub 1
	sbc a, a
	ld h, a
	pop af
	or a
	jr z, .LABEL.__LABEL57
	ld a, h
.LABEL.__LABEL57:
	or a
	jp z, .LABEL.__LABEL30
	ld hl, _dg
	dec (hl)
	ld a, 1
	ld (_key), a
	jp .LABEL.__LABEL25
.LABEL.__LABEL30:
	ld de, 64258
	ld hl, (_a)
	call .core.__EQ16
	push af
	ld a, (_key)
	sub 1
	sbc a, a
	ld h, a
	pop af
	or a
	jr z, .LABEL.__LABEL58
	ld a, h
.LABEL.__LABEL58:
	or a
	jp z, .LABEL.__LABEL32
	ld hl, _dg
	inc (hl)
	ld a, 1
	ld (_key), a
	jp .LABEL.__LABEL25
.LABEL.__LABEL32:
	ld de, 0
	ld hl, (_a)
	call .core.__EQ16
	push af
	ld a, (_key)
	dec a
	sub 1
	sbc a, a
	ld h, a
	pop af
	or a
	jr z, .LABEL.__LABEL59
	ld a, h
.LABEL.__LABEL59:
	or a
	jp z, .LABEL.__LABEL25
	xor a
	ld (_key), a
.LABEL.__LABEL25:
	call _Scroller
#line 263 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

		call	nextsid_vsync

#line 266 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
	ld a, (_timer)
	push af
	ld a, 22
	call _NextRegA
	ld hl, _timer
	dec (hl)
	ld a, (_timer)
	ld l, a
	ld h, 0
	ex de, hl
	ld hl, .LABEL._sintable
	add hl, de
	ld a, (hl)
	push af
	ld a, 23
	call _NextRegA
	call _draw_sprites
	call _copper_wobble
	ld a, (_timer3)
	or a
	jp nz, .LABEL.__LABEL36
	call _pal_cycle
	ld a, 3
	ld (_timer3), a
	jp .LABEL.__LABEL37
.LABEL.__LABEL36:
	ld hl, _timer3
	dec (hl)
.LABEL.__LABEL37:
	jp .LABEL.__LABEL22
.LABEL._rand_num1:
#line 368 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

rand_num:
		dw 00

#line 372 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._sintable:
#line 749 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

		db 64,62,60,59,57,56,54,53,51,49,48,46,45,43,42,40
		db 39,37,36,35,33,32,30,29,28,27,25,24,23,22,20,19
		db 18,17,16,15,14,13,12,11,10,9,8,8,7,6,6,5
		db 4,4,3,3,2,2,1,1,1,0,0,0,0,0,0,0
		db 0,0,0,0,0,0,0,1,1,1,2,2,2,3,3,4
		db 5,5,6,7,7,8,9,10,11,11,12,13,14,15,16,18
		db 19,20,21,22,23,25,26,27,28,30,31,33,34,35,37,38
		db 40,41,43,44,46,47,49,50,52,53,55,56,58,60,61,63
		db 64,66,67,69,71,72,74,75,77,78,80,81,83,84,86,87
		db 89,90,92,93,94,96,97,99,100,101,102,104,105,106,107,108
		db 109,111,112,113,114,115,116,116,117,118,119,120,120,121,122,122
		db 123,124,124,125,125,125,126,126,126,127,127,127,127,127,127,127
		db 127,127,127,127,127,127,127,126,126,126,125,125,124,124,123,123
		db 122,121,121,120,119,119,118,117,116,115,114,113,112,111,110,109
		db 108,107,105,104,103,102,100,99,98,97,95,94,92,91,90,88
		db 87,85,84,82,81,79,78,76,74,73,71,70,68,67,65,64
		db 64,62,60,59,57,56,54,53,51,49,48,46,45,43,42,40
		db 39,37,36,35,33,32,30,29,28,27,25,24,23,22,20,19
		db 18,17,16,15,14,13,12,11,10,9,8,8,7,6,6,5
		db 4,4,3,3,2,2,1,1,1,0,0,0,0,0,0,0
		db 0,0,0,0,0,0,0,1,1,1,2,2,2,3,3,4
		db 5,5,6,7,7,8,9,10,11,11,12,13,14,15,16,18
		db 19,20,21,22,23,25,26,27,28,30,31,33,34,35,37,38
		db 40,41,43,44,46,47,49,50,52,53,55,56,58,60,61,63
		db 64,66,67,69,71,72,74,75,77,78,80,81,83,84,86,87
		db 89,90,92,93,94,96,97,99,100,101,102,104,105,106,107,108
		db 109,111,112,113,114,115,116,116,117,118,119,120,120,121,122,122
		db 123,124,124,125,125,125,126,126,126,127,127,127,127,127,127,127
		db 127,127,127,127,127,127,127,126,126,126,125,125,124,124,123,123
		db 122,121,121,120,119,119,118,117,116,115,114,113,112,111,110,109
		db 108,107,105,104,103,102,100,99,98,97,95,94,92,91,90,88
		db 87,85,84,82,81,79,78,76,74,73,71,70,68,67,65,64

		db 0,-1,-3,-4,-6,-7,-9,-10,-11,-12,-13,-14,-14,-15,-15,-15
		db -15,-15,-15,-15,-14,-13,-12,-11,-10,-9,-8,-6,-5,-3,-2,0
		db 0,2,3,5,6,8,9,10,11,12,13,14,15,15,15,15
		db 15,15,15,14,14,13,12,11,10,9,7,6,4,3,1,0
		db 0,-1,-3,-4,-6,-7,-9,-10,-11,-12,-13,-14,-14,-15,-15,-15
		db -15,-15,-15,-15,-14,-13,-12,-11,-10,-9,-8,-6,-5,-3,-2,0
		db 0,2,3,5,6,8,9,10,11,12,13,14,15,15,15,15
		db 15,15,15,14,14,13,12,11,10,9,7,6,4,3,1,0

#line 792 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._sintable2:
#line 794 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

		db 127,118,108,99,90,81,72,64,56,48,41,34,28,22,17,13
		db 9,6,3,1,0,0,0,1,2,4,7,11,15,20,25,31
		db 38,45,52,60,68,77,85,94,104,113,122,132,141,150,160,169
		db 177,186,194,202,209,216,223,229,234,239,243,247,250,252,253,254
		db 254,254,253,251,248,245,241,237,232,226,220,213,206,198,190,182
		db 173,164,155,146,136,127,118,108,99,90,81,72,64,56,48,41
		db 34,28,22,17,13,9,6,3,1,0,0,0,1,2,4,7
		db 11,15,20,25,31,38,45,52,60,68,77,85,94,104,113,122
		db 132,141,150,160,169,177,186,194,202,209,216,223,229,234,239,243
		db 247,250,252,253,254,254,254,253,251,248,245,241,237,232,226,220
		db 213,206,198,190,182,173,164,155,146,136,127,118,108,99,90,81
		db 72,64,56,48,41,34,28,22,17,13,9,6,3,1,0,0
		db 0,1,2,4,7,11,15,20,25,31,38,45,52,60,68,77
		db 85,94,104,113,122,132,141,150,160,169,177,186,194,202,209,216
		db 223,229,234,239,243,247,250,252,253,254,254,254,253,251,248,245
		db 241,237,232,226,220,213,206,198,190,182,173,164,155,146,136,127
		db 127,118,108,99,90,81,72,64,56,48,41,34,28,22,17,13
		db 9,6,3,1,0,0,0,1,2,4,7,11,15,20,25,31
		db 38,45,52,60,68,77,85,94,104,113,122,132,141,150,160,169
		db 177,186,194,202,209,216,223,229,234,239,243,247,250,252,253,254
		db 254,254,253,251,248,245,241,237,232,226,220,213,206,198,190,182
		db 173,164,155,146,136,127,118,108,99,90,81,72,64,56,48,41
		db 34,28,22,17,13,9,6,3,1,0,0,0,1,2,4,7
		db 11,15,20,25,31,38,45,52,60,68,77,85,94,104,113,122
		db 132,141,150,160,169,177,186,194,202,209,216,223,229,234,239,243
		db 247,250,252,253,254,254,254,253,251,248,245,241,237,232,226,220
		db 213,206,198,190,182,173,164,155,146,136,127,118,108,99,90,81
		db 72,64,56,48,41,34,28,22,17,13,9,6,3,1,0,0
		db 0,1,2,4,7,11,15,20,25,31,38,45,52,60,68,77
		db 85,94,104,113,122,132,141,150,160,169,177,186,194,202,209,216
		db 223,229,234,239,243,247,250,252,253,254,254,254,253,251,248,245
		db 241,237,232,226,220,213,206,198,190,182,173,164,155,146,136,127

#line 828 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._wavea:
#line 830 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

wavea:
test_waveforma:
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000

#line 838 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._waveb:
#line 840 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

waveb:
test_waveformb:
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000

#line 848 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._wavec:
#line 850 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

test_waveformc:
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000
		db 128,000,128,000,128,000,128,000

#line 857 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._font:
#line 859 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

		push namespace font
font:
		incbin "./data/Block_bold.SpecCHR"
		pop namespace

#line 865 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._tiles:
#line 867 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"


tiletable:
		incbin "./data/tiles.nxb"


#line 873 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
#line 874 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

palbuff:
		incbin "./data/tiles.nxp"

#line 878 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._msg1:
#line 880 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
	:
		db 5, 00, 01, 02, 02, 03

#line 883 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._msg2:
#line 886 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
	:
		db 7, 05, 06, 04, 07, 00, 06, 08

#line 889 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
.LABEL._sintable3:
#line 212 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"

sintable3:

		db 1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3
		db 3,4,4,4,4,5,5,5,6,6,6,6,7,7,7,8
		db 8,8,9,9,9,9,10,10,10,11,11,12,12,12,13,13
		db 13,14,14,14,15,15,15,16,16,16,17,17,17,18,18,18
		db 19,19,20,20,20,21,21,21,21,22,22,22,23,23,23,24
		db 24,24,24,25,25,25,26,26,26,26,27,27,27,27,27,28
		db 28,28,28,28,29,29,29,29,29,29,29,30,30,30,30,30
		db 30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30
		db 30,30,30,30,30,30,30,30,30,30,30,29,29,29,29,29
		db 29,28,28,28,28,28,27,27,27,27,27,26,26,26,26,25
		db 25,25,25,24,24,24,23,23,23,23,22,22,22,21,21,21
		db 20,20,20,19,19,19,18,18,18,17,17,16,16,16,15,15
		db 15,14,14,14,13,13,13,12,12,12,11,11,11,10,10,10
		db 9,9,9,8,8,8,7,7,7,6,6,6,6,5,5,5
		db 5,4,4,4,4,3,3,3,3,2,2,2,2,2,1,1
		db 1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0
		db 1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3
		db 3,4,4,4,4,5,5,5,6,6,6,6,7,7,7,8
		db 8,8,9,9,9,9,10,10,10,11,11,12,12,12,13,13
		db 13,14,14,14,15,15,15,16,16,16,17,17,17,18,18,18
		db 19,19,20,20,20,21,21,21,21,22,22,22,23,23,23,24
		db 24,24,24,25,25,25,26,26,26,26,27,27,27,27,27,28
		db 28,28,28,28,29,29,29,29,29,29,29,30,30,30,30,30
		db 30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30
		db 30,30,30,30,30,30,30,30,30,30,30,29,29,29,29,29
		db 29,28,28,28,28,28,27,27,27,27,27,26,26,26,26,25
		db 25,25,25,24,24,24,23,23,23,23,22,22,22,21,21,21
		db 20,20,20,19,19,19,18,18,18,17,17,16,16,16,15,15
		db 15,14,14,14,13,13,13,12,12,12,11,11,11,10,10,10
		db 9,9,9,8,8,8,7,7,7,6,6,6,6,5,5,5
		db 5,4,4,4,4,3,3,3,3,2,2,2,2,2,1,1
		db 1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0


#line 249 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"
#line 250 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"

cycle_palette:
		db 224,192,160,128,96,64,32,129
		db 32, 64, 96, 128, 160, 192, 224, 224

#line 255 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"
	call _copper_wobble
	ld hl, (_coppere_xdelta - 1)
	ld a, (_copperi)
	add a, h
	ld h, a
	ld a, (_copperb)
	add a, h
	ld h, a
	ld a, (_copper_line)
	add a, h
	ld h, a
	ld a, (_copperc)
	add a, h
	ld h, a
	ld a, (_copperd)
	add a, h
	ld h, a
	ld a, (_coppere_ydelta)
	add a, h
	ld h, a
	ld a, (_copperj)
	add a, h
	call .core.BORDER
	ld hl, 0
	ld b, h
	ld c, l
.core.__END_PROGRAM:
	di
	ld hl, (.core.__CALL_BACK__)
	ld sp, hl
	pop iy
	ret
_check_interrupts:
#line 859 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"


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
#line 881 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
		ret

	.interrupt_enabled_flag:
		db 1


#line 887 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_check_interrupts__leave:
	ret
_GetReg:
#line 890 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		push    bc
		ld      bc,$243B
		out     (c),a

		inc     b
		in      a,(c)
		pop     bc

#line 899 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_GetReg__leave:
	ret
_PlotL2:
#line 917 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"


		PROC
plot_l2:
		LOCAL ._no_wrap



		pop     hl

		ld      e,a
		ld      bc,LAYER2_ACCESS_PORT
		pop     af
		ld      d,a
		and     $c0
		cp      $c0
		jr      nz,._no_wrap
		xor     a
	._no_wrap:
		ENDP

#line 938 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
.LABEL._LayerShadow:
#line 939 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		or      3
		out     (c),a
		ld      a,d
		and     63
		ld      d,a
		pop     af
		ld      (de),a
skip_wrap2:
		ld      a,2
		out     (c),a
		push    hl



#line 954 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_PlotL2__leave:
	ret
_NextRegA:
#line 1178 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		PROC
		LOCAL   reg
		ld      (reg),a
		pop     hl
		pop     af
		DW $92ED
reg:
		db      0
		push    hl
		ENDP

#line 1190 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_NextRegA__leave:
	ret
_InitSprites2:
#line 1323 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		PROC
		LOCAL spr_nobank, spr_address, sploop, sp_out


		ld      (spr_address+1), hl
		exx
		pop     hl
		exx

		ld      d, a


		pop     hl
		pop     af
		nextreg $50,a
		inc     a
		nextreg $51,a

		pop     af
		ld      bc, SPRITE_STATUS_SLOT_SELECT_P_303B
		out     (c), a

spr_nobank:

		ld      b,d

spr_address:
		ld      hl,0

sploop:

		push    bc
		ld      bc,$005b
		otir
		pop     bc
		djnz    sploop

		nextreg $50, $FF
		nextreg $51, $FF

sp_out:
		exx
		push    hl
		exx

		ENDP


#line 1372 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_InitSprites2__leave:
	ret
_UpdateSprite:
	push ix
	ld ix, 0
	add ix, sp
#line 1436 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"






		ld a,(IX+9)
		ld bc, $303b

		out (c), a

		ld bc, $57
		ld a,(IX+4)
		out (c), a

		ld a,(IX+7)
		out (c), a

		ld d,(IX+13)


		ld a,(IX+5)
		and 1
		or d
		out (c), a


		ld a,(IX+11)
		or 192

		out (c), a
		ld a,(IX+15)
		out (c), a


#line 1471 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_UpdateSprite__leave:
	exx
	ld hl, 12
__EXIT_FUNCTION:
	ld sp, ix
	pop ix
	pop de
	add hl, sp
	ld sp, hl
	push de
	exx
	ret
_ShowLayer2:
#line 3171 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"


		or  a
		jr  z, disable_
		nextreg DISPLAY_CONTROL_NR_69,128
		ret
disable_:
		nextreg DISPLAY_CONTROL_NR_69,0

#line 3180 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_ShowLayer2__leave:
	ret
_ClipLayer2:
	push ix
	ld ix, 0
	add ix, sp
#line 3647 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		ld a,(IX+5)
	DW $92ED : DB 24
		ld a,(IX+7)
	DW $92ED : DB 24
		ld a,(IX+9)
	DW $92ED : DB 24
		ld a,(IX+11)
	DW $92ED : DB 24

#line 3657 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_ClipLayer2__leave:
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
_ClipTile:
	push ix
	ld ix, 0
	add ix, sp
#line 3679 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"

		ld a,(IX+5)
	DW $92ED : DB 27
		ld a,(IX+7)
	DW $92ED : DB 27
		ld a,(IX+9)
	DW $92ED : DB 27
		ld a,(IX+11)
	DW $92ED : DB 27

#line 3689 "/home/usb/Documents/NextBuildv9/Scripts/nextlib.bas"
_ClipTile__leave:
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
_ClearLayer2:
#line 139 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"




		ld      c, a
		ld      a, (_screen_mode)
		jp      _pick_screenmode

#line 147 "/home/usb/Documents/NextBuildv9/Scripts/nb_LAYER2.bas"
	xor a
	call _InitLayer2
_ClearLayer2__leave:
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
_GetKeyScanCode:
#line 72 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/stdlib/keys.bas"

		PROC
		LOCAL END_KEY
		LOCAL LOOP

		ld l, 1
		ld a, l
LOOP:
		cpl
		ld h, a
		in a, (0FEh)
		cpl
		and 1Fh
		jr nz, END_KEY

		ld a, l
		rla
		ld l, a
		jr nc, LOOP
		ld h, a
END_KEY:
		ld l, a
		ENDP

#line 96 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/stdlib/keys.bas"
_GetKeyScanCode__leave:
	ret
_setpsgclock:
#line 283 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

		ex de,hl
		call nextsid_set_psg_clock

#line 287 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
_setpsgclock__leave:
	ret
_draw_sprites:
	push ix
	ld ix, 0
	add ix, sp
	ld hl, 0
	push hl
	push hl
	xor a
	ld (_pcounter), a
	xor a
	ld (_pcounter2), a
	ld (ix-4), 64
	ld (ix-1), 0
	jp .LABEL.__LABEL38
.LABEL.__LABEL41:
	ld hl, (_position - 1)
	ld a, (_pcounter)
	add a, h
	ld l, a
	ld h, 0
	ex de, hl
	ld hl, .LABEL._sintable
	add hl, de
	ld a, (hl)
	ld (_sx), a
	ld a, (_position)
	add a, 64
	ld h, a
	ld a, (_pcounter)
	add a, h
	ld l, a
	ld h, 0
	ex de, hl
	ld hl, .LABEL._sintable
	add hl, de
	ld a, (hl)
	ld (_sy), a
	ld a, (_pcounter2)
	add a, (ix-1)
	ld l, a
	ld h, 0
	ex de, hl
	ld hl, .LABEL._sintable2
	add hl, de
	ld a, (hl)
	srl a
	srl a
	ld (ix-2), a
	ld a, (ix-1)
	add a, 64
	ld h, a
	ld a, (_pcounter2)
	add a, h
	ld l, a
	ld h, 0
	ex de, hl
	ld hl, .LABEL._sintable2
	add hl, de
	ld a, (hl)
	srl a
	srl a
	ld (ix-3), a
	ld a, (_pcounter)
	add a, 2
	ld h, a
	ld a, (_dg)
	add a, h
	ld (_pcounter), a
	ld hl, (_dh - 1)
	ld a, (_pcounter2)
	add a, h
	add a, 6
	ld (_pcounter2), a
	ld a, (_delay)
	or a
	jp nz, .LABEL.__LABEL43
	ld hl, _position
	inc (hl)
	ld a, 64
	ld (_delay), a
	ld hl, _delay2
	dec (hl)
	jp .LABEL.__LABEL44
.LABEL.__LABEL43:
	ld hl, _delay
	dec (hl)
.LABEL.__LABEL44:
	ld a, (_delay2)
	or a
	jp nz, .LABEL.__LABEL46
	ld a, (_sadd)
	add a, 8
	ld (_sadd), a
	ld a, 16
	ld hl, (_sadd - 1)
	cp h
	jp nc, .LABEL.__LABEL48
	xor a
	ld (_sadd), a
.LABEL.__LABEL48:
	xor a
	ld (_delay2), a
.LABEL.__LABEL46:
	ld a, (_sy)
	srl a
	srl a
	and 7
	ld (_s), a
	xor a
	push af
	xor a
	push af
	ld hl, (_s - 1)
	ld a, (_sadd)
	add a, h
	push af
	ld a, (ix-1)
	push af
	ld a, (_sy)
	add a, 88
	sub (ix-3)
	push af
	ld a, (_sx)
	add a, 120
	sub (ix-2)
	ld l, a
	ld h, 0
	push hl
	call _UpdateSprite
	inc (ix-1)
.LABEL.__LABEL38:
	ld h, (ix-1)
	ld a, (ix-4)
	dec a
	cp h
	jp nc, .LABEL.__LABEL41
_draw_sprites__leave:
	ld sp, ix
	pop ix
	ret
_pal_cycle:
#line 340 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"


		ld      hl,cycle_palette
		ld      a, (hl)
		ld      de,cycle_palette
		inc     hl
	ldi : ldi : ldi : ldi : ldi : ldi : ldi : ldi
	ldi : ldi : ldi : ldi : ldi : ldi : ldi : ldi
		dec     hl
		ld      (hl), a













#line 363 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
_pal_cycle__leave:
	ret
_rand:
#line 375 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"

rnd:
		ld  hl,0xA280
		ld  de,0xC0DE
		ld  (rnd+4),hl
		ld  a,l
		add a,a
		add a,a
		add a,a
		xor l
		ld  l,a
		ld  a,d
		add a,a
		xor d
		ld  h,a
		rra
		xor h
		xor l
		ld  h,e
		ld  l,a
		ld  (rnd+1),hl
		ld  (rand_num), a

#line 398 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
_rand__leave:
	ret
_ScrollerInit:
#line 401 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"


		call Scroller.inituscroll


#line 406 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
_ScrollerInit__leave:
	ret
_SetupTileHW:
#line 410 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"


	exx : pop hl : exx : push af

		nextreg PALETTE_CONTROL_NR_43,%00110000

		ld hl,palbuff
		ld b,31
_tmuploadloop:
	ld a,(hl) : nextreg PALETTE_VALUE_9BIT_NR_44,a
		inc hl
	ld a,(hl) :
		inc hl
		nextreg PALETTE_VALUE_9BIT_NR_44,a
		djnz _tmuploadloop


		nextreg TILEMAP_DEFAULT_ATTR_NR_6C,%00000001

		pop af
		nextreg TILEMAP_BASE_ADR_NR_6E,$5b
		pop af
		nextreg TILEMAP_GFX_ADR_NR_6F,$60

		nextreg ULA_CONTROL_NR_68,%00010000

		nextreg TILEMAP_TRANSPARENCY_I_NR_4C,$0
		pop af
		nextreg MMU2_4000_NR_52,41
		ld hl,$4000
		ld de,$6000
		ld bc,1248
		ldir

		nextreg MMU2_4000_NR_52,$0a
		ld hl,$5B00
		ld de,$5B01
		ld bc,1279
		ld (hl),46

		ldir

	exx : push hl : exx

#line 454 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
	ld a, 255
	push af
	xor a
	push af
	ld a, 255
	push af
	xor a
	push af
	call _ClipTile
_SetupTileHW__leave:
	ret
_MetaTile:
#line 476 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"


	exx : pop hl : exx





		ld hl,tiletable

		ld d,a
		ld e,16
		mul d,e

		add hl,de


		ld (bringback+1),hl


		ld hl,$5b00
		pop af
		add hl,a
		pop de
		ld e,40
		mul d,e
		add hl,de



bringback:
		ld de,0000
		ex de,hl
		ld c,0
		ld b,5
tilemaploop:
	ldi : ldi : ldi : ldi
		add de,40-4
		djnz tilemaploop

		exx
		push hl


#line 520 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
_MetaTile__leave:
	ret
_DrawMetaTable:
	push ix
	ld ix, 0
	add ix, sp
	ld hl, 0
	push hl
	ld l, (ix+4)
	ld h, (ix+5)
	ld a, (hl)
	ld (ix-1), a
	ld a, (ix+9)
	ld d, 8
	ld e, a
	mul d, e
	ld a, e
	add a, 2
	ld (ix+9), a
	ld hl, 1
	ld (_x), hl
	jp .LABEL.__LABEL49
.LABEL.__LABEL52:
	ld l, (ix+4)
	ld h, (ix+5)
	ex de, hl
	ld hl, (_x)
	add hl, de
	ld a, (hl)
	ld (ix-2), a
	ld a, (ix+9)
	push af
	ld a, (ix+7)
	ld l, a
	ld h, 0
	ex de, hl
	ld hl, (_x)
	add hl, de
	add hl, hl
	add hl, hl
	ld a, l
	push af
	ld a, (ix-2)
	call _MetaTile
	ld hl, (_x)
	inc hl
	ld (_x), hl
.LABEL.__LABEL49:
	ld a, (ix-1)
	ld l, a
	ld h, 0
	ld de, (_x)
	or a
	sbc hl, de
	jp nc, .LABEL.__LABEL52
_DrawMetaTable__leave:
	ld sp, ix
	pop ix
	exx
	pop hl
	pop bc
	pop bc
	ex (sp), hl
	exx
	ret
_Scroller:
#line 539 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"



		push namespace Scroller
		call updateuscroll
		call replicate

		ret



inituscroll:
		ld hl,message-1
		ld (scrollupos),hl
		ld hl,pixucount
		ld (hl),1
		ret

updateuscroll:
		ld hl,pixucount
		dec (hl)
		jr nz,scroll

newuchar:
		ld (hl),8

		ld hl,(scrollupos)
		inc hl
		ld (scrollupos),hl
		ld a,(hl)
		or a
		jr nz,getuglyph

loopumsg:
		ld hl,message
		ld (scrollupos),hl

getuglyph:
		ld l,(hl)
		ld h,0
		add hl,hl
		add hl,hl
		add hl,hl
		ld de,.font.font-256
		add hl,de

		ld de,tempchar
		ld bc,8
		ldir

scroll:
		ld hl,20735-32
		ld de,tempchar

		ld c,8

nextrow:
		ex de,hl
		rl (hl)
		ex de,hl
		push hl

		ld b,32

scrollrow:
		rl (hl)
		dec l
		djnz scrollrow

		pop hl
		inc h
		inc de
		dec c
		jr nz,nextrow

		ret


replicate:

		ld      b, 32
		ld      e, 0

		ld      hl,sintable
		ld      a, (sintimer)
		add     hl, a

left:
		push    hl
		push    bc

		ld      a, (hl)
		ld      (copy_line+1), a

		ld      b, 184-12
		ld      c,16

rep_loop:

		ld      d,b

		PIXELAD
		ld      a,(hl)
		SPRITE_CONTROL_NR_15
copy_line:
		ld      d,0

		PIXELAD

		ld      (hl),a
		inc     b
		ld      hl, copy_line+1
		inc     (hl)
		dec     c
		ld      a, c
		or      a
		jr      nz, rep_loop

		ld      a, 8
		add     a, e
		ld      e, a


		ld      a,(counter)
		dec     a
		jr      nz, overadd
		ld      a, 18
		ld      hl,sintimer
		inc     (hl)

overadd:
		ld      (counter),a
		pop     bc
		dec     b
		xor     a
		or      b
		pop     hl
		inc     hl
		inc     hl

		jr      nz, left
		ret

startline:
		db 16
counter:
		db 16

tempchar:
		db 0,0,0,0,0,0,0,0

scrollupos: dw 0
pixucount:  db 0


message:

		db "                                     "
		db " Hello and welcome to my entry to the DOTJAM!!   -------- "
		db "  I have probably broken all the rules but I got carried away and just ejoyed myself, there's still room left but I have to stop tweaking     ------"
		db "  You are listening to the excellent NextSID engine by 9bitcolor and chiptune by z00m            "
		db "                There were'nt any rules about all being my yourelf right??           ------               "
		db "  demo coding & gfx by em00k, nextsid engine by 9bitcolor, music by z00m           "
		db "            you can now use keys QW - OP to adjust the sprite patterns press 1 for a random mix       "
		db "     big fat greets to all the usual lot and you             -------   emk 12/06/22  ------                              "
		db 0

sintimer:
		db 0

sintable:
		db 16,14,13,12,11,10,9,8,7,6,5,4,3,2,2,1
		db 1,0,0,0,0,0,0,0,0,0,0,1,1,2,3,3
		db 4,5,6,7,8,9,10,11,13,14,15,16,17,18,20,21
		db 22,23,24,25,26,27,28,28,29,30,30,31,31,31,31,31
		db 31,31,31,31,31,30,30,29,29,28,27,26,25,24,23,22
		db 21,20,19,18,17,16,14,13,12,11,10,9,8,7,6,5
		db 4,3,2,2,1,1,0,0,0,0,0,0,0,0,0,0
		db 1,1,2,3,3,4,5,6,7,8,9,10,11,13,14,15
		db 16,17,18,20,21,22,23,24,25,26,27,28,28,29,30,30
		db 31,31,31,31,31,31,31,31,31,31,30,30,29,29,28,27
		db 26,25,24,23,22,21,20,19,18,17,16,14,13,12,11,10
		db 9,8,7,6,5,4,3,2,2,1,1,0,0,0,0,0
		db 0,0,0,0,0,1,1,2,3,3,4,5,6,7,8,9
		db 10,11,13,14,15,16,17,18,20,21,22,23,24,25,26,27
		db 28,28,29,30,30,31,31,31,31,31,31,31,31,31,31,30
		db 30,29,29,28,27,26,25,24,23,22,21,20,19,18,17,16

		db 16,14,13,12,11,10,9,8,7,6,5,4,3,2,2,1
		db 1,0,0,0,0,0,0,0,0,0,0,1,1,2,3,3
		db 4,5,6,7,8,9,10,11,13,14,15,16,17,18,20,21
		db 22,23,24,25,26,27,28,28,29,30,30,31,31,31,31,31
		db 31,31,31,31,31,30,30,29,29,28,27,26,25,24,23,22
		db 21,20,19,18,17,16,14,13,12,11,10,9,8,7,6,5
		db 4,3,2,2,1,1,0,0,0,0,0,0,0,0,0,0
		db 1,1,2,3,3,4,5,6,7,8,9,10,11,13,14,15
		db 16,17,18,20,21,22,23,24,25,26,27,28,28,29,30,30
		db 31,31,31,31,31,31,31,31,31,31,30,30,29,29,28,27
		db 26,25,24,23,22,21,20,19,18,17,16,14,13,12,11,10
		db 9,8,7,6,5,4,3,2,2,1,1,0,0,0,0,0
		db 0,0,0,0,0,1,1,2,3,3,4,5,6,7,8,9
		db 10,11,13,14,15,16,17,18,20,21,22,23,24,25,26,27
		db 28,28,29,30,30,31,31,31,31,31,31,31,31,31,31,30
		db 30,29,29,28,27,26,25,24,23,22,21,20,19,18,17,16
		pop namespace

#line 745 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/DOTJAM.bas"
_Scroller__leave:
	ret
_copper_wobble:
#line 6 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"
	:

copper_wobble:
		ld      a,2


		xor     a
		ld      (._copper_line),a
		ld      a,(._copperb)
		ld      (._coppere_ydelta),a
		ld      (._coppere_xdelta),a




		ld      a, 2
		ld      (._copperc),a

		ld      b,64

cop_upload_copper_lineoopa:

		nextreg COPPER_DATA_NR_60,128
		ld      a,(._copper_line)
		nextreg COPPER_DATA_NR_60,a



		ld      hl,Scroller.sintable
		ld      a,(._coppere_xdelta)
		add     hl,a
		ld      a,(hl)
		ld      (._copperi),a


		nextreg COPPER_DATA_NR_60,TILEMAP_XOFFSET_LSB_NR_30
		ld      a,(._copperi)
		nextreg COPPER_DATA_NR_60,a


		ld      hl,sintable3
		ld      a,(._coppere_ydelta)
		add     hl,a
		ld      a,(hl)
		ld      (._copperj),a


		nextreg COPPER_DATA_NR_60,ULA_YOFFSET_NR_27
		sll     a
		srl     a
		sub      210

		nextreg COPPER_DATA_NR_60,a

		nextreg COPPER_DATA_NR_60, PALETTE_CONTROL_NR_43
		nextreg COPPER_DATA_NR_60,%00110000

		nextreg COPPER_DATA_NR_60, PALETTE_INDEX_NR_40
		nextreg COPPER_DATA_NR_60,2

		nextreg COPPER_DATA_NR_60,PALETTE_VALUE_NR_41
		ld      hl,sintable3
		ld      a,(._coppere_ydelta)
		add     hl, a
		ld      a, (hl)
		sll     a
		sll     a
		and     %00011100
		nextreg COPPER_DATA_NR_60,a


		ld      hl,._coppere_ydelta
		inc     (hl)
		ld      hl,._copper_line
		inc     (hl)
		ld      hl,._coppere_xdelta
		inc     (hl)


		djnz    cop_upload_copper_lineoopa


		nextreg COPPER_DATA_NR_60, PALETTE_CONTROL_NR_43
		nextreg COPPER_DATA_NR_60,%00010000

		nextreg COPPER_DATA_NR_60, PALETTE_INDEX_NR_40
		nextreg COPPER_DATA_NR_60,1

		ld      b, 16
		ld      hl, cycle_palette
	1:

		ld      a, (hl)
		nextreg COPPER_DATA_NR_60, PALETTE_VALUE_NR_41

		add     a,a
		ld      e, a
		mirror
		xor e

		and %11100100

		nextreg COPPER_DATA_NR_60,a
		inc     hl
		djnz    1B




		ld      b,64
		ld      a,192
		ld      (._copper_line),a

cop_upload_copper_lineoopb:

		nextreg COPPER_DATA_NR_60,128
		ld      a,(._copper_line)
		nextreg COPPER_DATA_NR_60,a



		ld      hl,Scroller.sintable
		ld      a,(._coppere_xdelta)
		add     hl,a
		ld      a,(hl)
		ld      (._copperi),a


		nextreg COPPER_DATA_NR_60,TILEMAP_XOFFSET_LSB_NR_30
		ld      a,(._copperi)
		nextreg COPPER_DATA_NR_60,a


		ld      hl,sintable3
		ld      a,(._coppere_ydelta)
		add     hl,a
		ld      a,(hl)
		ld      (._copperj),a

		nextreg COPPER_DATA_NR_60, PALETTE_CONTROL_NR_43
		nextreg COPPER_DATA_NR_60,%00110000

		nextreg COPPER_DATA_NR_60, PALETTE_INDEX_NR_40
		nextreg COPPER_DATA_NR_60,2

		nextreg COPPER_DATA_NR_60,PALETTE_VALUE_NR_41
		ld      hl,sintable3
		ld      a,(._coppere_ydelta)
		add     hl, a
		ld      a, (hl)
		sll     a
		sll     a
		and     %00011100
		nextreg COPPER_DATA_NR_60,a


		ld      hl,._coppere_ydelta
		inc     (hl)
		ld      hl,._copper_line
		inc     (hl)
		ld      hl,._coppere_xdelta
		inc     (hl)


		djnz    cop_upload_copper_lineoopb


		nextreg COPPER_DATA_NR_60,%10000001
		nextreg COPPER_DATA_NR_60,242
		nextreg COPPER_CONTROL_LO_NR_61,0
		nextreg COPPER_CONTROL_HI_NR_62,%11000000

		ld      hl,._coppere_ydelta
		inc     (hl)

		ld      hl,._copperd


		ld      hl,._copperc
		ld      a,(._copperb)
		add     a,(hl)
		ld      (._copperb),a









wait_raster_copper_lineine:











#line 209 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"
_copper_wobble__leave:
	ret
	;; --- end of user code ---
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/border.asm"
	; __FASTCALL__ Routine to change de border
	; Parameter (color) specified in A register

	    push namespace core

	BORDER EQU 229Bh

	    pop namespace


	; Nothing to do! (Directly from the ZX Spectrum ROM)
#line 214 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"
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
#line 215 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"
#line 1 "/home/usb/Documents/NextBuildv9/zxbasic1.18.1/src/lib/arch/zxnext/runtime/cmp/eq16.asm"
	    push namespace core

__EQ16:	; Test if 16bit values HL == DE
    ; Returns result in A: 0 = False, FF = True
	    xor a	; Reset carry flag
	    sbc hl, de
	    ret nz
	    inc a
	    ret

	    pop namespace
#line 216 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"
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

#line 217 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"
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

#line 218 "/home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/FULLPROGRAMS/DOTJAM/inc-copper.bas"

	END
