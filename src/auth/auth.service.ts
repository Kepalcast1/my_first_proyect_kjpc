import { Injectable, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {LoginDto} from '../users/dto/login.dto';
import {PrismaService} from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService, private prisma: PrismaService) {}

    async validateUser(user: LoginDto){
        const foundUser = await this.prisma.user.findUnique({
            where: {
                email: user.email
            }
        });

        if (!foundUser) return null;

        const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);

        if (isPasswordValid) {
            return this.jwtService.sign({
                id: foundUser.id,
                email: foundUser.email,
                roles: foundUser.role,
                
            })
        } else {
            throw new UnauthorizedException('Invalid credentials');
        }
    }
}