<?php

namespace App\Enums;

enum MedicalLeaveType: string
{
    case Occupational = 'occupational';
    case Accident = 'accident';
    case Illness = 'illness';
    case Maternity = 'maternity';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
