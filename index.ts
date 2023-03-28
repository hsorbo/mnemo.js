const shot_length = 16;
const header_length = 10;

export enum Direction {
    In = 0,
    Out = 1
}

export enum ShotType {
    CSA,
    CSB,
    STD,
    EOC
}

export interface Shot {
    type: ShotType;
    head_in: number;
    head_out: number;
    length: number;
    depth_in: number;
    depth_out: number;
    pitch_in: number;
    pitch_out: number;
    marker: number;
}

// Survey, in ariane known as BASX.
export interface Survey {
    date: Date;
    name: string;
    direction: Direction;
    shots: Shot[];
}


function read_shot(buf: Buffer, at: number): Shot {
    return {
        type: buf.readUInt8(at + 0),
        head_in: buf.readInt16BE(at + 1) / 10,
        head_out: buf.readInt16BE(at + 3) / 10,
        length: buf.readInt16BE(at + 5) / 100,
        depth_in: buf.readInt16BE(at + 7) / 100,
        depth_out: buf.readInt16BE(at + 9) / 100,
        pitch_in: buf.readInt16BE(at + 11) / 10,
        pitch_out: buf.readInt16BE(at + 13) / 10,
        marker: buf.readUInt8(at + 14)
    };
}

function write_shot(buf: Buffer, at: number, shot: Shot) {
    buf.writeUInt8(shot.type, at + 0);
    buf.writeInt16BE(shot.head_in * 10, at + 1);
    buf.writeInt16BE(shot.head_out * 10, at + 3);
    buf.writeInt16BE(Math.round(shot.length * 100), at + 5);
    buf.writeInt16BE(Math.round(shot.depth_in * 100), at + 7);
    buf.writeInt16BE(Math.round(shot.depth_out * 100), at + 9);
    buf.writeInt16BE(shot.pitch_in * 10, at + 11);
    buf.writeInt16BE(shot.pitch_out * 10, at + 13);
    buf.writeUInt8(shot.marker, at + 14);
}

function read_shots(buf: Buffer, at: number): Shot[] {
    const shots: Shot[] = []
    for (let i = 0; i < buf.length; i += shot_length) {
        const shot = read_shot(buf, i + at);
        shots.push(shot)
        if (shot.type === ShotType.EOC) break;
    }
    return shots;
}

function write_shots(buf: Buffer, at: number, shots: Shot[]) {
    //todo: assert last and only last is EOC
    shots.forEach((shot, i) => {
        write_shot(buf, at + (i * shot_length), shot);
    })
}

function read_survey(buf: Buffer, at: number): Survey {
    const magic = buf.readUInt8(at + 0);
    const year = buf.readUInt8(at + 1);

    if (magic !== 2) {
        throw new Error("Invalid file format");
    }

    if (year > 100 || year < 16) {
        throw new Error("Invalid year");
    }

    return {
        date: new Date(year + 2000,
            buf.readUInt8(at + 2),
            buf.readUInt8(at + 3),
            buf.readUInt8(at + 4),
            buf.readUInt8(at + 5)),
        name: buf.toString("ascii", at + 6, at + 9),
        direction: buf.readUInt8(at + 9),
        shots: read_shots(buf, at + header_length)
    };
}

function write_survey(buf: Buffer, at: number, survey: Survey) {
    buf.writeUInt8(2, at + 0);
    buf.writeUInt8(survey.date.getFullYear() - 2000, at + 1);
    buf.writeUInt8(survey.date.getMonth(), at + 2);
    buf.writeUInt8(survey.date.getDay() - 1, at + 3);
    buf.writeUInt8(survey.date.getHours(), at + 4);
    buf.writeUInt8(survey.date.getMinutes(), at + 5);
    buf.write(survey.name, at + 6, 3, "ascii");
    buf.writeUInt8(survey.direction, at + 9);
    write_shots(buf, at + header_length, survey.shots);
}


function binary_size_of(survey: Survey) {
    return header_length + (survey.shots.length * shot_length)
}

function read_surveys(buf: Buffer): Survey[] {
    const surveys: Survey[] = [];
    let at = 0;
    while (at + header_length < buf.length) {
        const survey = read_survey(buf, at);
        surveys.push(survey);
        at += binary_size_of(survey);
    }
    return surveys;
}

function write_surveys(buf: Buffer, surveys: Survey[]) {
    let at = 0;
    surveys.forEach((survey) => {
        write_survey(buf, at, survey);
        at += binary_size_of(survey);
    });
}

export function dmpToByteArray(dmp_data: string): Uint8Array {
    return new Uint8Array(dmp_data.split(';').map(x => parseInt(x)));
}

export function dmpFromByteArray(arr: Uint8Array): string {
    let s = "";
    arr.forEach((x) => {
        s = `${s}${(x << 24 >> 24).toString()};`;
    });
    return s + "\n";
}

export function surveyListFromByteArray(raw: Uint8Array): Survey[] {
    return read_surveys(Buffer.from(raw));
}

export function surveyListToByteArray(surveys: Survey[]): Uint8Array {
    const size = surveys
        .map(x => binary_size_of(x))
        .reduce((acc, x) => acc + x, 0);
    const buf = Buffer.alloc(size);
    write_surveys(buf, surveys);
    return buf;
}