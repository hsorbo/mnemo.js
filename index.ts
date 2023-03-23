import { Parser } from "binary-parser";
const shot_length = 16;
const header_length = 10;

enum Direction {
    In = 0,
    Out = 1
}

enum ShotType {
    CSA,
    CSB,
    STD,
    EOC
}

class Shot {
    type: ShotType;
    head_in: number;
    head_out: number;
    length: number;
    depth_in: number;
    depth_out: number;
    pitch_in: number;
    pitch_out: number;
    marker: string;

    constructor(type: ShotType, head_in: number, head_out: number, length: number, depth_in: number, depth_out: number, pitch_in: number, pitch_out: number, marker: string) {
        this.type = type;
        this.head_in = head_in;
        this.head_out = head_out;
        this.length = length;
        this.depth_in = depth_in;
        this.depth_out = depth_out;
        this.pitch_in = pitch_in;
        this.pitch_out = pitch_out;
        this.marker = marker;
    }
}

class Bas {
    date: Date;
    name: string;
    direction: Direction;
    shots: Shot[];

    constructor(date: Date, sname: string, direction: Direction, shots: Shot[]) {
        this.date = date;
        this.name = sname;
        this.direction = direction;
        this.shots = shots;
    }
}

function dmp_to_byte_array(raw: string): Uint8Array {
    return new Uint8Array(raw.split(';').map(x => parseInt(x)));
}

function parse_hdr(raw: Uint8Array): any {
    const p = new Parser()
        .uint8("magic")
        .uint8("year")
        .uint8("month")
        .uint8("day")
        .uint8("hour")
        .uint8("minute")
        .string("name", { encoding: "ascii", length: 3 })
        .uint8("direction");

    const hdr = p.parse(raw);

    if (hdr.magic !== 2) {
        throw new Error("Invalid file format");
    }

    if (hdr.year > 40, hdr.year < 16) {
        throw new Error("Invalid year");
    }
    return hdr;
}

function parse_shot(raw: Uint8Array): Shot {
    const p = new Parser()
        .uint8("type")
        .int16be("head_in")
        .int16be("head_out")
        .int16be("length")
        .int16be("depth_in")
        .int16be("depth_out")
        .int16be("pitch_in")
        .int16be("pitch_out")
        .uint8("marker");

    const s = p.parse(raw);
    return new Shot(
        s.type,
        s.head_in / 10,
        s.head_out / 10,
        s.length / 100,
        s.depth_in / 100,
        s.depth_out / 100,
        s.pitch_in / 10,
        s.pitch_out / 10,
        s.marker);
}

function parse_shots(raw: Uint8Array): Shot[] {
    
    let chunk = raw;
    const shots : Shot[] = []
    while (true) {
        const shot = parse_shot(chunk);
        shots.push(shot)
        if (shot.type === ShotType.EOC) break;
        chunk = chunk.slice(shot_length);
    }
    return shots;
}

function parse_survey(byte_string: Uint8Array): Bas {
    const head = byte_string.slice(0, header_length);
    const tail = byte_string.slice(header_length);
    const hdr = parse_hdr(head);
    const shots = parse_shots(tail);
    return new Bas(
        new Date(hdr.year + 2000, hdr.month, hdr.day, hdr.hour, hdr.minute),
        hdr.name,
        hdr.direction,
        shots);
}

function parse_surveys(byte_string: Uint8Array): Bas[] {
    let surveys: Bas[] = [];
    let cursor = byte_string;
    while (cursor.length > header_length) {
        const survey = parse_survey(cursor);
        surveys.push(survey);
        const size = 10 + (survey.shots.length * 16);
        //console.log(`read: ${size}, size: ${cursor.length}`);
        cursor = cursor.slice(size);
    }
    return surveys;

}

export function from_string(raw: string): Bas[] {
    return parse_surveys(dmp_to_byte_array(raw));
}
