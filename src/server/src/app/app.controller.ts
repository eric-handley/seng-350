import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  @ApiOperation({ summary: "Get system health status" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "System health information",
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        now: { type: "string", format: "date-time" },
        message: { type: "string" },
        error: { type: "string" },
      },
    },
  })
  async getHealth() {
    return this.appService.getHealthCheck();
  }
}
