import { PublishCommand } from '@aws-sdk/client-sns';
import { AwsSnsProvider } from './aws-sns.provider';

const mockPublish = jest.fn();
jest.mock('@aws-sdk/client-sns', () => ({
  ...jest.requireActual('@aws-sdk/client-sns'),
  SNSClient: jest.fn().mockImplementation(() => ({ send: mockPublish })),
}));

describe('AWS SNS delivery', () => {
  const originalEnv = process.env;
  const topicArn = 'arn:aws:sns:eu-north-1:123456789012:fixture-topic';

  beforeEach(() => {
    process.env = { AWS_REGION: 'eu-north-1', AWS_SNS_TOPIC_ARN: topicArn };
    mockPublish.mockResolvedValue({ MessageId: 'test-message' });
  });

  afterEach(() => {
    process.env = originalEnv;
    mockPublish.mockReset();
  });

  it('publishes to the configured topic when no phone number is supplied', async () => {
    const result = await new AwsSnsProvider().send({
      recipient: {},
      title: 'Fixture alert',
      message: 'Test notification',
      actionUrl: 'https://fixture.example.invalid',
    });
    expect(result).toEqual({ success: true });
    const [command] = mockPublish.mock.calls[0] as [PublishCommand];
    expect(command.input).toEqual({
      TopicArn: topicArn,
      Subject: 'Fixture alert',
      Message:
        'Test notification\n\nAction URL: https://fixture.example.invalid',
    });
  });

  it('reports a direct SMS denial without publishing private content to the topic', async () => {
    mockPublish.mockRejectedValueOnce(new Error('AuthorizationError fixture'));
    const result = await new AwsSnsProvider().send({
      recipient: { phoneNumber: '+12025550100' },
      title: 'Fixture alert',
      message: 'Test notification',
    });
    expect(result).toEqual({
      success: false,
      error: 'AuthorizationError fixture',
    });
    expect(mockPublish).toHaveBeenCalledTimes(1);
    const [command] = mockPublish.mock.calls[0] as [PublishCommand];
    expect(command.input.PhoneNumber).toBe('+12025550100');
    expect(command.input.TopicArn).toBeUndefined();
  });
});
