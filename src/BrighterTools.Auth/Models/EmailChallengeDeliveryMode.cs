using System.Text.Json.Serialization;

namespace BrighterTools.Auth.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmailChallengeDeliveryMode
{
    Code = 1,
    Link = 2,
    CodeAndLink = 3
}
