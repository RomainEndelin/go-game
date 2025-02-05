import { FC } from "react";

interface GoBoardProps {
    size: number
}
export const GoBoard: FC<GoBoardProps> = ({ size }) => {
    return <table>
        {
            Array.from(Array(size)).map(() =>
                <tr>
                    {Array.from(Array(size)).map(() =>
                        <td className="w-5">+</td>)}
                </tr>)
        }
    </table>
}
